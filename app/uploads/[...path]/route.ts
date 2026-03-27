import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const UPLOAD_ROOT = path.resolve(process.cwd(), "public", "uploads");
const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  txt: "text/plain; charset=utf-8",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSafePath(targetPath: string) {
  const normalizedRoot = `${UPLOAD_ROOT}${path.sep}`;
  return targetPath === UPLOAD_ROOT || targetPath.startsWith(normalizedRoot);
}

function getContentType(filePath: string) {
  const ext = path.extname(filePath).replace(".", "").toLowerCase();
  return MIME_MAP[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const segments = (resolvedParams.path ?? []).filter(Boolean);

  if (segments.length === 0) {
    return NextResponse.json({ message: "文件不存在" }, { status: 404 });
  }

  const unsafePath = path.join(UPLOAD_ROOT, ...segments);
  const filePath = path.resolve(unsafePath);

  if (!isSafePath(filePath)) {
    return NextResponse.json({ message: "非法路径" }, { status: 400 });
  }

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json({ message: "文件不存在" }, { status: 404 });
  }
}
