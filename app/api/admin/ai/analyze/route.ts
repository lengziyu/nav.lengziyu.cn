import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTagList } from "@/lib/utils";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

const analyzeSchema = z.object({
  url: z.url({ message: "请输入正确链接" }),
  provider: z.enum(["openrouter", "gemini"]).default("openrouter"),
  model: z.string().trim().min(1, "请选择模型"),
});

type AiDraft = {
  title?: string;
  description?: string;
  tags?: string[];
  categoryName?: string;
  categoryStyle?: "CARD" | "LIST";
  coverImageUrl?: string;
};

const TAG_ZH_MAP: Record<string, string> = {
  ai: "人工智能",
  llm: "大模型",
  rag: "检索增强",
  agent: "智能体",
  agents: "智能体",
  workflow: "工作流",
  workflows: "工作流",
  automation: "自动化",
  automate: "自动化",
  tool: "工具",
  tools: "工具",
  productivity: "效率",
  prompt: "提示词",
  prompts: "提示词",
  model: "模型",
  models: "模型",
  open: "开源",
  source: "开源",
  "open-source": "开源",
  oss: "开源",
  api: "接口",
  sdk: "开发套件",
  plugin: "插件",
  plugins: "插件",
  frontend: "前端",
  backend: "后端",
  web: "网页",
  devops: "运维",
  database: "数据库",
  search: "搜索",
  image: "图像",
  vision: "视觉",
  video: "视频",
  audio: "音频",
  speech: "语音",
  writing: "写作",
  coding: "编程",
  code: "代码",
  deploy: "部署",
  docs: "文档",
  github: "开源社区",
  react: "React生态",
  vue: "Vue生态",
  nextjs: "Next.js",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
};

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

function containsChinese(text: string) {
  return /[\u3400-\u9fff]/.test(text);
}

function resolveMaybeRelativeUrl(value: string, baseUrl: string) {
  const text = value.trim();
  if (!text) {
    return "";
  }
  if (text.startsWith("//")) {
    return `https:${text}`;
  }
  try {
    const parsed = new URL(text);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // ignore invalid absolute url
  }

  try {
    return new URL(text, baseUrl).toString();
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
    const githubRepoMatch =
      parsed.hostname === "github.com" ? parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/?$/) : null;

    if (githubRepoMatch) {
      const owner = githubRepoMatch[1];
      const repo = githubRepoMatch[2];
      const ghResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        cache: "no-store",
      });

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
          sourceTitle: toPascalName(repoData.full_name?.split("/").pop() || repo),
          sourceDescription: repoData.description ?? "",
          sourceCoverImage: `https://opengraph.githubassets.com/1/${owner}/${repo}`,
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
      extractTag(
        html,
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      );

    const coverImage =
      extractTag(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      extractTag(html, /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    const plainText = stripHtml(html).slice(0, 5000);

    return {
      sourceTitle: title,
      sourceDescription: description,
      sourceCoverImage: resolveMaybeRelativeUrl(coverImage, targetUrl),
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

function toPascalName(raw: string) {
  return raw
    .replace(/\.git$/i, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join("")
    .replace(/Ai/g, "AI")
    .replace(/Llm/g, "LLM")
    .replace(/Gpt/g, "GPT")
    .replace(/Api/g, "API")
    .replace(/Ui/g, "UI")
    .replace(/Db/g, "DB");
}

function normalizeTagKey(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\.js$/g, "js")
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
    .trim();
}

function translateTagToChinese(tag: string) {
  const raw = tag.trim();
  if (!raw) {
    return "";
  }
  if (containsChinese(raw)) {
    return raw;
  }

  const normalized = normalizeTagKey(raw);
  if (!normalized) {
    return "";
  }

  if (TAG_ZH_MAP[normalized]) {
    return TAG_ZH_MAP[normalized];
  }

  const translatedParts = normalized
    .split(/\s+/)
    .map((part) => TAG_ZH_MAP[part] || "")
    .filter(Boolean);

  if (translatedParts.length > 0) {
    return translatedParts.join(" ");
  }

  const compact = raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 14);
  if (!compact) {
    return "工具";
  }
  return `${compact}工具`;
}

function buildGeneratedCoverUrl(title: string) {
  return `/api/public/cover?title=${encodeURIComponent(title.slice(0, 28))}`;
}

function cleanSnippet(text: string, maxLength: number) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[#>*`]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidCoverUrl(value: string) {
  if (!value) {
    return false;
  }
  if (value.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeAiDraft(raw: unknown): AiDraft {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const data = raw as Record<string, unknown>;
  const draft: AiDraft = {};

  if (typeof data.title === "string") {
    const title = data.title.trim();
    if (title.length >= 2) {
      draft.title = title.slice(0, 120);
    }
  }

  if (typeof data.description === "string") {
    const description = cleanSnippet(data.description, 320);
    if (description.length >= 8) {
      draft.description = description;
    }
  }

  if (Array.isArray(data.tags)) {
    const tags = data.tags.filter((item): item is string => typeof item === "string");
    draft.tags = normalizeTagList(tags);
  } else if (typeof data.tags === "string") {
    draft.tags = normalizeTagList(data.tags.split(/[,，/|]/g));
  }

  if (typeof data.categoryName === "string") {
    const categoryName = data.categoryName.trim();
    if (categoryName.length >= 2) {
      draft.categoryName = categoryName.slice(0, 24);
    }
  }

  if (data.categoryStyle === "CARD" || data.categoryStyle === "LIST") {
    draft.categoryStyle = data.categoryStyle;
  }

  if (typeof data.coverImageUrl === "string") {
    const coverImageUrl = data.coverImageUrl.trim();
    if (isValidCoverUrl(coverImageUrl)) {
      draft.coverImageUrl = coverImageUrl;
    }
  }

  return draft;
}

function buildFallbackDescription(input: {
  title: string;
  domain: string;
  sourceDescription: string;
  sourceText: string;
}) {
  const { title, domain, sourceDescription, sourceText } = input;
  const cleanedDescription = cleanSnippet(sourceDescription, 180);
  if (cleanedDescription && containsChinese(cleanedDescription)) {
    const suffix = /[。！？.!?]$/.test(cleanedDescription) ? "" : "。";
    return `${title}：${cleanedDescription}${suffix}可通过官网或仓库文档快速了解核心能力。`.slice(
      0,
      320,
    );
  }

  const contentSnippet = cleanSnippet(sourceText, 160);
  if (contentSnippet && containsChinese(contentSnippet)) {
    const suffix = /[。！？.!?]$/.test(contentSnippet) ? "" : "。";
    return `${title}：${contentSnippet}${suffix}`.slice(0, 320);
  }

  const domainText = domain ? `来自 ${domain} 的` : "";
  return `${title} 是${domainText}工具或开源项目，提供核心能力与使用入口，适合加入你的导航收藏。`.slice(
    0,
    320,
  );
}

function normalizeChineseTags(tags: string[]) {
  return normalizeTagList(tags.map((tag) => translateTagToChinese(tag))).slice(0, 8);
}

async function generateWithProvider(provider: "openrouter" | "gemini", model: string, prompt: string) {
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
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${geminiModel}:generateContent`,
    {
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
    },
  );

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

async function localizeToChineseWithAi(input: {
  provider: "openrouter" | "gemini";
  model: string;
  title: string;
  description: string;
  tags: string[];
}) {
  const prompt = `
你是中文本地化编辑，请把下面的简介和标签转换为自然、准确的简体中文。
必须仅返回 JSON，不要返回其它内容。

输出 JSON:
{
  "description": "中文简介，20~90字",
  "tags": ["中文标签，最多8个，每个2~8字"]
}

标题: ${input.title}
简介: ${input.description}
标签: ${input.tags.join(" / ")}
`.trim();

  const text = await generateWithProvider(input.provider, input.model, prompt);
  const parsed = normalizeAiDraft(parseAiJson(text));

  return {
    description: parsed.description || "",
    tags: parsed.tags || [],
  };
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
  const parsedUrl = new URL(url);
  const githubRepoMatch =
    parsedUrl.hostname === "github.com" ? parsedUrl.pathname.match(/^\/([^/]+)\/([^/]+)\/?$/) : null;
  const domain = extractDomainText(url);
  const fallbackTitle = githubRepoMatch
    ? toPascalName(githubRepoMatch[2])
    : source.sourceTitle || domain || "未命名站点";

  try {
    const prompt = `
你是导航站编辑助手。请根据输入网站信息，生成站点入库字段。
必须仅返回 JSON，不要返回任何额外文本。
描述和标签必须使用简体中文，且清晰简洁。
如果目标是 GitHub 仓库，title 使用品牌化写法（例如 agents-flex => AgentsFlex），不要输出 owner/repo。

输出 JSON Schema:
{
  "title": "string, 2~120",
  "description": "string, 8~320, 中文",
  "tags": ["最多8个中文标签"],
  "categoryName": "string, 建议优先匹配已有分类",
  "categoryStyle": "CARD or LIST",
  "coverImageUrl": "可选, http/https URL。若无法提供，留空"
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
    const aiDraft = normalizeAiDraft(aiRaw);

    let normalizedTags = normalizeTagList(aiDraft.tags ?? []);
    const aiTitle = aiDraft.title || fallbackTitle;
    const safeTitle = (githubRepoMatch ? toPascalName(githubRepoMatch[2]) : aiTitle).slice(0, 120);

    let safeDescription = (
      aiDraft.description ||
      buildFallbackDescription({
        title: safeTitle,
        domain,
        sourceDescription: source.sourceDescription,
        sourceText: source.sourceText,
      })
    ).slice(0, 320);

    const needChineseLocalization =
      !containsChinese(safeDescription) || normalizedTags.some((tag) => !containsChinese(tag));

    if (needChineseLocalization) {
      try {
        const localized = await localizeToChineseWithAi({
          provider,
          model,
          title: safeTitle,
          description: safeDescription,
          tags: normalizedTags,
        });

        if (localized.description) {
          safeDescription = localized.description.slice(0, 320);
        }

        if (localized.tags.length > 0) {
          normalizedTags = localized.tags;
        }
      } catch {
        // ignore and continue with deterministic chinese fallback
      }
    }

    if (!containsChinese(safeDescription)) {
      safeDescription = buildFallbackDescription({
        title: safeTitle,
        domain,
        sourceDescription: "",
        sourceText: "",
      });
    }

    normalizedTags = normalizeChineseTags(normalizedTags);

    if (normalizedTags.length === 0) {
      normalizedTags = normalizeChineseTags([
        githubRepoMatch ? "开源" : "",
        domain.includes("github") ? "开源社区" : "",
        safeTitle.includes("AI") ? "人工智能" : "工具",
      ]);
    }

    const suggestedCategoryName = aiDraft.categoryName?.trim() ?? "";
    const matchedCategoryId = suggestedCategoryName
      ? findCategoryIdByName(categories, suggestedCategoryName)
      : "";
    const finalCoverImage =
      aiDraft.coverImageUrl || source.sourceCoverImage || buildGeneratedCoverUrl(safeTitle);

    return NextResponse.json({
      data: {
        title: safeTitle,
        description: safeDescription,
        tags: normalizedTags,
        coverImageUrl: finalCoverImage,
        categoryName: suggestedCategoryName,
        categoryStyle: aiDraft.categoryStyle || "CARD",
        matchedCategoryId,
      },
    });
  } catch (error) {
    const fallbackDescription = buildFallbackDescription({
      title: fallbackTitle,
      domain,
      sourceDescription: source.sourceDescription,
      sourceText: source.sourceText,
    }).slice(0, 320);

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "AI 分析失败",
        data: {
          title: fallbackTitle.slice(0, 120),
          description: fallbackDescription,
          tags: normalizeChineseTags(["工具", "人工智能"]),
          coverImageUrl: source.sourceCoverImage || buildGeneratedCoverUrl(fallbackTitle),
          categoryName: "",
          categoryStyle: "CARD",
          matchedCategoryId: "",
        },
      },
      { status: 200 },
    );
  }
}
