import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

const OPENROUTER_FALLBACK_MODELS = [
  "openrouter/auto",
  "openrouter/horizon-beta",
  "google/gemini-2.5-flash-preview",
  "deepseek/deepseek-chat-v3-0324:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

type Provider = "openrouter" | "gemini";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const providerParam = request.nextUrl.searchParams.get("provider");
  const provider: Provider = providerParam === "gemini" ? "gemini" : "openrouter";

  try {
    if (provider === "openrouter") {
      if (!OPENROUTER_API_KEY) {
        return NextResponse.json({ provider, models: OPENROUTER_FALLBACK_MODELS, message: "未配置 OPENROUTER_API_KEY，已展示推荐模型" });
      }

      const response = await fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
      });

      if (!response.ok) {
        return NextResponse.json({ provider, models: OPENROUTER_FALLBACK_MODELS, message: "OpenRouter 模型列表拉取失败，已展示推荐模型" });
      }

      const result = (await response.json()) as {
        data?: Array<{ id?: string }>;
      };

      const models = (result.data ?? [])
        .map((item) => item.id || "")
        .filter((id) => id.length > 0)
        .slice(0, 60);

      return NextResponse.json({ provider, models: models.length > 0 ? models : OPENROUTER_FALLBACK_MODELS });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        provider,
        models: ["gemini-2.5-flash", "gemini-2.0-flash"],
        message: "未配置 GEMINI_API_KEY，已展示默认模型",
      });
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      method: "GET",
      cache: "no-store",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        provider,
        models: ["gemini-2.5-flash", "gemini-2.0-flash"],
        message: "Gemini 模型列表拉取失败，已展示默认模型",
      });
    }

    const result = (await response.json()) as {
      models?: Array<{
        name?: string;
        supportedGenerationMethods?: string[];
      }>;
    };

    const models = (result.models ?? [])
      .filter((item) => (item.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((item) => (item.name || "").replace(/^models\//, ""))
      .filter(Boolean)
      .slice(0, 40);

    return NextResponse.json({
      provider,
      models: models.length > 0 ? models : ["gemini-2.5-flash", "gemini-2.0-flash"],
    });
  } catch {
    if (provider === "openrouter") {
      return NextResponse.json({ provider, models: OPENROUTER_FALLBACK_MODELS, message: "OpenRouter 请求失败，已展示推荐模型" }, { status: 200 });
    }
    return NextResponse.json({
      provider,
      models: ["gemini-2.5-flash", "gemini-2.0-flash"],
      message: "Gemini 请求失败，已展示默认模型",
    });
  }
}
