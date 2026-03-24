import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const site = await prisma.site.update({
      where: { id },
      data: { likes: { increment: 1 } },
      select: { likes: true },
    });

    return NextResponse.json(site);
  } catch {
    return NextResponse.json({ message: "站点不存在" }, { status: 404 });
  }
}
