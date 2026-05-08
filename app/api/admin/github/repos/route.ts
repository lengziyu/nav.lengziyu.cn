import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
export const dynamic = "force-dynamic";

const listSchema = z.object({
  query: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

type GithubSearchResult = {
  items?: Array<{
    id?: number;
    name?: string;
    full_name?: string;
    html_url?: string;
    homepage?: string | null;
    description?: string | null;
    stargazers_count?: number;
    language?: string | null;
    topics?: string[];
  }>;
};

function normalizeGithubQuery(raw: string | undefined) {
  if (!raw) {
    return "topic:ai stars:>1000";
  }

  const query = raw.trim();
  if (!query) {
    return "topic:ai stars:>1000";
  }

  return query;
}

function cleanSiteUrl(rawUrl: string) {
  const input = rawUrl.trim();
  if (!input) {
    return "";
  }

  try {
    const parsed = new URL(input);
    const pathname = parsed.pathname.replace(/\/+$/g, "") || "/";
    const base = `${parsed.protocol}//${parsed.host}`;
    return `${base}${pathname === "/" ? "" : pathname}`;
  } catch {
    return input;
  }
}

function normalizeUrlKey(rawUrl: string) {
  return cleanSiteUrl(rawUrl).toLowerCase();
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const parsed = listSchema.safeParse({
    query: request.nextUrl.searchParams.get("query") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const query = normalizeGithubQuery(parsed.data.query);
  const limit = parsed.data.limit;
  const searchQuery = `${query} fork:false archived:false`;
  const perPage = Math.min(100, Math.max(30, limit * 6));

  const existingSites = await prisma.site.findMany({
    select: {
      url: true,
    },
  });
  const existingUrlKeys = new Set(existingSites.map((site) => normalizeUrlKey(site.url)).filter(Boolean));

  const response = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=${perPage}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "nav-lengziyu-github-crawler",
        ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
      },
    },
  ).catch(() => null);

  if (!response || !response.ok) {
    const message = response?.status === 403
      ? "GitHub API 触发频率限制，请稍后重试或配置 GITHUB_TOKEN"
      : "GitHub 仓库抓取失败";
    return NextResponse.json({ message }, { status: 400 });
  }

  const result = (await response.json().catch(() => ({}))) as GithubSearchResult;

  const seen = new Set<string>();

  const repos = (result.items ?? [])
    .filter((item) => item.id && item.full_name && item.html_url)
    .map((item, index) => {
      const fullName = item.full_name || "";
      const repoUrl = item.html_url || "";
      const homepage = item.homepage || "";
      const repoUrlKey = normalizeUrlKey(repoUrl);
      const homepageKey = normalizeUrlKey(homepage);

      return {
        rawId: String(item.id || `${Date.now()}-${index}`),
        fullName,
        url: repoUrl,
        homepage,
        description: item.description || "",
        stars: item.stargazers_count || 0,
        language: item.language || "",
        topics: Array.isArray(item.topics) ? item.topics.slice(0, 8) : [],
        coverImageUrl: `https://opengraph.githubassets.com/1/${fullName}`,
        repoUrlKey,
        homepageKey,
      };
    })
    .filter((item) => {
      // 先排除已收录 URL（仓库地址或官网地址）
      if (item.repoUrlKey && existingUrlKeys.has(item.repoUrlKey)) {
        return false;
      }
      if (item.homepageKey && existingUrlKeys.has(item.homepageKey)) {
        return false;
      }

      // 再做一次结果内去重（官网可能重复）
      const dedupeKey = item.homepageKey || item.repoUrlKey || item.rawId;
      if (seen.has(dedupeKey)) {
        return false;
      }
      seen.add(dedupeKey);
      return true;
    })
    .slice(0, limit)
    .map((item, index) => {
      return {
        id: String(item.rawId || `${Date.now()}-${index}`),
        fullName: item.fullName,
        url: item.url,
        homepage: item.homepage,
        description: item.description,
        stars: item.stars,
        language: item.language,
        topics: item.topics,
        coverImageUrl: item.coverImageUrl,
      };
    });

  return NextResponse.json({ query, repos });
}
