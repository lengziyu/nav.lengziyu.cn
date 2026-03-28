import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateCategorySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        description: parsed.data.description,
        style: parsed.data.style,
        defaultSort: parsed.data.defaultSort,
      },
    });

    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ message: "分类不存在" }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          sites: true,
          submissions: true,
        },
      },
    },
  });

  if (!category) {
    return NextResponse.json({ message: "分类不存在" }, { status: 404 });
  }

  if ((category._count.sites ?? 0) > 0 || (category._count.submissions ?? 0) > 0) {
    return NextResponse.json({ message: "该分类下有数据，无法删除" }, { status: 400 });
  }

  await prisma.category.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
