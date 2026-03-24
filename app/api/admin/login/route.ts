import { NextResponse } from "next/server";
import { z } from "zod";

import { setAdminCookie, validateAdminPassword } from "@/lib/auth";

const loginSchema = z.object({
  password: z.string().min(1, "请输入管理密码"),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  if (!validateAdminPassword(parsed.data.password)) {
    return NextResponse.json({ message: "密码错误" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminCookie(response);
  return response;
}
