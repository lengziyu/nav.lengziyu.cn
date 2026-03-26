import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdminRequest } from "@/lib/auth";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

const listSchema = z.object({
  query: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(10).default(10),
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
  const perPage = Math.max(20, limit * 2);

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

  const repos = (result.items ?? [])
    .filter((item) => item.id && item.full_name && item.html_url)
    .slice(0, limit)
    .map((item, index) => {
      const fullName = item.full_name || "";
      return {
        id: String(item.id || `${Date.now()}-${index}`),
        fullName,
        url: item.html_url || "",
        homepage: item.homepage || "",
        description: item.description || "",
        stars: item.stargazers_count || 0,
        language: item.language || "",
        topics: Array.isArray(item.topics) ? item.topics.slice(0, 8) : [],
        coverImageUrl: `https://opengraph.githubassets.com/1/${fullName}`,
      };
    });

  return NextResponse.json({ query, repos });
}
