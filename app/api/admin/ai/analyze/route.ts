import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTagList } from "@/lib/utils";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

const analyzeSchema = z.object({
  url: z.url({ message: "请输入正确链接" }),
  provider: z.enum(["ollama", "openrouter", "gemini"]).default("ollama"),
  model: z.string().trim().min(1, "请选择模型"),
});

const aiResultSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(8).max(320),
  tags: z.array(z.string().trim().min(1).max(20)).max(8).default([]),
  categoryName: z.string().trim().min(2).max(24).optional(),
  categoryStyle: z.enum(["CARD", "LIST"]).optional(),
  coverImageUrl: z.url().optional(),
});

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function extractDomainText(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function findCategoryIdByName(
  categories: Array<{ id: string; name: string }>,
  categoryName: string,
) {
  const normalized = categoryName.trim().toLowerCase();
  const exact = categories.find((item) => item.name.trim().toLowerCase() === normalized);
  if (exact) {
    return exact.id;
  }

  const partial = categories.find(
    (item) => item.name.includes(categoryName) || categoryName.includes(item.name),
  );
  return partial?.id ?? "";
}

async function buildSourceContext(targetUrl: string) {
  try {
    const parsed = new URL(targetUrl);
    const githubRepoMatch = parsed.hostname === "github.com" ? parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/?$/) : null;

    if (githubRepoMatch) {
      const owner = githubRepoMatch[1];
      const repo = githubRepoMatch[2];
      const ghResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { cache: "no-store" });

      if (ghResponse.ok) {
        const repoData = (await ghResponse.json()) as {
          full_name?: string;
          description?: string | null;
          homepage?: string | null;
          language?: string | null;
          topics?: string[];
          stargazers_count?: number;
        };

        const text = [
          `GitHub Repo: ${repoData.full_name ?? `${owner}/${repo}`}`,
          `Description: ${repoData.description ?? ""}`,
          `Homepage: ${repoData.homepage ?? ""}`,
          `Language: ${repoData.language ?? ""}`,
          `Topics: ${(repoData.topics ?? []).join(", ")}`,
          `Stars: ${repoData.stargazers_count ?? 0}`,
        ]
          .join("\n")
          .trim();

        return {
          sourceTitle: repoData.full_name ?? `${owner}/${repo}`,
          sourceDescription: repoData.description ?? "",
          sourceCoverImage: "",
          sourceText: text.slice(0, 4000),
        };
      }
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; nav-bot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error("网页读取失败");
    }

    const html = (await response.text()).slice(0, 300_000);

    const title =
      extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ||
      extractTag(html, /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    const description =
      extractTag(html, /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      extractTag(html, /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    const coverImage =
      extractTag(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      extractTag(html, /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    const plainText = stripHtml(html).slice(0, 5000);

    return {
      sourceTitle: title,
      sourceDescription: description,
      sourceCoverImage: coverImage,
      sourceText: plainText,
    };
  } catch {
    return {
      sourceTitle: "",
      sourceDescription: "",
      sourceCoverImage: "",
      sourceText: "",
    };
  }
}

function parseAiJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function generateWithProvider(provider: "ollama" | "openrouter" | "gemini", model: string, prompt: string) {
  if (provider === "ollama") {
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.2,
        },
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error("调用 Ollama 失败");
    }

    const ollamaResult = (await ollamaResponse.json()) as {
      response?: string;
    };

    return ollamaResult.response ?? "";
  }

  if (provider === "openrouter") {
    if (!OPENROUTER_API_KEY) {
      throw new Error("未配置 OPENROUTER_API_KEY");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("调用 OpenRouter 失败");
    }

    const result = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    return result.choices?.[0]?.message?.content ?? "";
  }

  if (!GEMINI_API_KEY) {
    throw new Error("未配置 GEMINI_API_KEY");
  }

  const geminiModel = model.startsWith("models/") ? model : `models/${model}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${geminiModel}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("调用 Gemini 失败");
  }

  const result = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  return (result.candidates?.[0]?.content?.parts ?? []).map((item) => item.text || "").join("\n");
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = analyzeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const { url, model, provider } = parsed.data;
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      style: true,
    },
  });

  const source = await buildSourceContext(url);
  const fallbackTitle = source.sourceTitle || extractDomainText(url) || "未命名站点";
  const fallbackDescription =
    source.sourceDescription || "该站点包含与 AI / 前端相关的内容，可进一步补充描述。";

  try {
    const prompt = `
你是导航站编辑助手。请根据输入网站信息，生成站点入库字段。
必须仅返回 JSON，不要返回任何额外文本。

输出 JSON Schema:
{
  "title": "string, 2~120",
  "description": "string, 8~320",
  "tags": ["最多8个标签"],
  "categoryName": "string, 建议优先匹配已有分类",
  "categoryStyle": "CARD or LIST",
  "coverImageUrl": "可选, http/https URL"
}

已有分类（优先从中选择）:
${categories.map((item) => `- ${item.name} (${item.style})`).join("\n")}

目标链接:
${url}

抓取到的信息:
Title: ${source.sourceTitle}
Description: ${source.sourceDescription}
Cover: ${source.sourceCoverImage}
Content:
${source.sourceText}
`.trim();

    const llmText = await generateWithProvider(provider, model, prompt);
    const aiRaw = parseAiJson(llmText);
    const aiParsed = aiResultSchema.safeParse(aiRaw);

    const normalizedTags = normalizeTagList(aiParsed.success ? aiParsed.data.tags : []);
    const safeTitle = (aiParsed.success ? aiParsed.data.title : fallbackTitle).slice(0, 120);
    const safeDescription = (aiParsed.success ? aiParsed.data.description : fallbackDescription).slice(0, 320);
    const suggestedCategoryName = aiParsed.success ? aiParsed.data.categoryName?.trim() ?? "" : "";
    const matchedCategoryId = suggestedCategoryName
      ? findCategoryIdByName(categories, suggestedCategoryName)
      : "";

    return NextResponse.json({
      data: {
        title: safeTitle,
        description: safeDescription,
        tags: normalizedTags,
        coverImageUrl:
          (aiParsed.success ? aiParsed.data.coverImageUrl : "") || source.sourceCoverImage || "",
        categoryName: suggestedCategoryName,
        categoryStyle: aiParsed.success ? aiParsed.data.categoryStyle || "CARD" : "CARD",
        matchedCategoryId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "AI 分析失败",
        data: {
          title: fallbackTitle.slice(0, 120),
          description: fallbackDescription.slice(0, 320),
          tags: [],
          coverImageUrl: source.sourceCoverImage || "",
          categoryName: "",
          categoryStyle: "CARD",
          matchedCategoryId: "",
        },
      },
      { status: 200 },
    );
  }
}
