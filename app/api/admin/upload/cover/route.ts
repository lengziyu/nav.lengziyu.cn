import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const runtime = "nodejs";

function sanitizeBaseName(raw: string) {
  const base = raw.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 32);
  return base || "cover";
}

function resolveFileExt(file: File) {
  if (MIME_TO_EXT[file.type]) {
    return MIME_TO_EXT[file.type];
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (Object.values(MIME_TO_EXT).includes(extension)) {
    return extension;
  }

  return "";
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const rawFile = formData?.get("file");

  if (!(rawFile instanceof File)) {
    return NextResponse.json({ message: "请选择图片文件" }, { status: 400 });
  }

  if (rawFile.size <= 0) {
    return NextResponse.json({ message: "图片不能为空" }, { status: 400 });
  }

  if (rawFile.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "图片不能超过 5MB" }, { status: 400 });
  }

  const extension = resolveFileExt(rawFile);
  if (!extension) {
    return NextResponse.json({ message: "仅支持 jpg/png/webp/gif/avif" }, { status: 400 });
  }

  const now = new Date();
  const dateFolder = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "covers", dateFolder);
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${randomBytes(4).toString("hex")}-${sanitizeBaseName(rawFile.name)}.${extension}`;
  const filePath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await rawFile.arrayBuffer());

  await writeFile(filePath, buffer);

  return NextResponse.json({
    url: `/uploads/covers/${dateFolder}/${fileName}`,
  });
}
