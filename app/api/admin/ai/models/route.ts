import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Ollama 请求失败");
    }

    const result = (await response.json()) as {
      models?: Array<{ name?: string; model?: string }>;
    };

    const models = (result.models ?? [])
      .map((item) => item.name || item.model || "")
      .filter((name) => name.length > 0);

    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [], message: "无法连接 Ollama，请确认本地服务已启动" }, { status: 200 });
  }
}
