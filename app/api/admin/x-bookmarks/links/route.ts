import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const importSchema = z.object({
  text: z.string().trim().min(1, "请先粘贴 X 书签内容").max(120_000, "内容太长，请分批导入"),
  limit: z.coerce.number().int().min(1).max(80).default(20),
});

type LinkDraft = {
  id: string;
  url: string;
  title: string;
  description: string;
  coverImageUrl: string;
  tags: string[];
};

function cleanSiteUrl(rawUrl: string) {
  const input = rawUrl.trim();
  if (!input) {
    return "";
  }

  try {
    const parsed = new URL(input);
    parsed.hash = "";
    const pathname = parsed.pathname.replace(/\/+$/g, "") || "/";
    const base = `${parsed.protocol}//${parsed.host}`;
    return `${base}${pathname === "/" ? "" : pathname}${parsed.search}`;
  } catch {
    return input;
  }
}

function normalizeUrlKey(rawUrl: string) {
  return cleanSiteUrl(rawUrl).toLowerCase();
}

function isXUrl(rawUrl: string) {
  try {
    const hostname = new URL(rawUrl).hostname.replace(/^www\./, "");
    return hostname === "x.com" || hostname === "twitter.com" || hostname === "t.co" || hostname.endsWith(".twitter.com");
  } catch {
    return true;
  }
}

function getLogoUrl(rawUrl: string) {
  try {
    const { hostname } = new URL(rawUrl);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=256`;
  } catch {
    return "";
  }
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function stripHtml(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractTag(html: string, pattern: RegExp) {
  return decodeHtml(html.match(pattern)?.[1]?.trim() ?? "");
}

function extractAttr(tag: string, attr: string) {
  const match = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, "i"));
  return decodeHtml(match?.[1]?.trim() ?? "");
}

function extractMetaContent(html: string, key: string, value: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    if (extractAttr(tag, key).toLowerCase() === value.toLowerCase()) {
      return extractAttr(tag, "content");
    }
  }

  return "";
}

function resolveAssetUrl(rawAssetUrl: string, pageUrl: string) {
  if (!rawAssetUrl) {
    return "";
  }

  try {
    return new URL(rawAssetUrl, pageUrl).toString();
  } catch {
    return rawAssetUrl;
  }
}

function extractUrls(text: string) {
  const matches = text.match(/https?:\/\/[^\s<>"'，。！？；、（）()[\]{}]+/gi) ?? [];
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const match of matches) {
    const cleaned = cleanSiteUrl(match.replace(/[),.;!?]+$/g, ""));
    const key = normalizeUrlKey(cleaned);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    urls.push(cleaned);
  }

  return urls;
}

async function resolveShortUrl(rawUrl: string) {
  try {
    const hostname = new URL(rawUrl).hostname.replace(/^www\./, "");
    if (hostname !== "t.co") {
      return rawUrl;
    }

    const response = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; nav-lengziyu-x-import/1.0)",
      },
    });

    return cleanSiteUrl(response.url || rawUrl);
  } catch {
    return rawUrl;
  }
}

function fallbackTitleFromUrl(rawUrl: string) {
  try {
    const { hostname } = new URL(rawUrl);
    return hostname.replace(/^www\./, "");
  } catch {
    return rawUrl;
  }
}

async function fetchMetadata(rawUrl: string): Promise<LinkDraft> {
  const fallbackTitle = fallbackTitleFromUrl(rawUrl);
  const logoUrl = getLogoUrl(rawUrl);

  try {
    const response = await fetch(rawUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; nav-lengziyu-x-import/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error("fetch failed");
    }

    const html = (await response.text()).slice(0, 180_000);
    const title =
      extractMetaContent(html, "property", "og:title") ||
      extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ||
      fallbackTitle;
    const description =
      extractMetaContent(html, "name", "description") ||
      extractMetaContent(html, "property", "og:description") ||
      `${fallbackTitle} 是从 X 书签导入的网站。`;
    const coverImage =
      extractMetaContent(html, "property", "og:image") ||
      extractMetaContent(html, "name", "twitter:image");

    return {
      id: normalizeUrlKey(rawUrl),
      url: rawUrl,
      title: stripHtml(title).slice(0, 120) || fallbackTitle,
      description: stripHtml(description).slice(0, 320) || `${fallbackTitle} 是从 X 书签导入的网站。`,
      coverImageUrl: resolveAssetUrl(coverImage, rawUrl) || logoUrl,
      tags: ["X 书签"],
    };
  } catch {
    return {
      id: normalizeUrlKey(rawUrl),
      url: rawUrl,
      title: fallbackTitle,
      description: `${fallbackTitle} 是从 X 书签导入的网站。`,
      coverImageUrl: logoUrl,
      tags: ["X 书签"],
    };
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const existingSites = await prisma.site.findMany({
    select: {
      url: true,
    },
  });
  const existingUrlKeys = new Set(existingSites.map((site) => normalizeUrlKey(site.url)).filter(Boolean));
  const importedUrls = extractUrls(parsed.data.text);
  const resolvedUrls: string[] = [];
  const seen = new Set<string>();

  for (const url of importedUrls) {
    const resolvedUrl = cleanSiteUrl(await resolveShortUrl(url));
    const key = normalizeUrlKey(resolvedUrl);

    if (!key || seen.has(key) || existingUrlKeys.has(key) || isXUrl(resolvedUrl)) {
      continue;
    }

    seen.add(key);
    resolvedUrls.push(resolvedUrl);

    if (resolvedUrls.length >= parsed.data.limit) {
      break;
    }
  }

  const links: LinkDraft[] = [];
  for (const url of resolvedUrls) {
    links.push(await fetchMetadata(url));
  }

  return NextResponse.json({
    scanned: importedUrls.length,
    links,
  });
}
