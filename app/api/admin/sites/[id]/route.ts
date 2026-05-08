import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureTagIds } from "@/lib/tag-helpers";
import { updateSiteSchema } from "@/lib/validators";
import { normalizeTagList } from "@/lib/utils";

function toSiteUpdateErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return "站点不存在";
    }
    if (error.code === "P2002") {
      return "数据冲突，请检查 URL 或标签后重试";
    }
    if (error.code === "P2003") {
      return "分类不存在或已失效，请刷新页面后重试";
    }
  }
  return "更新失败，请稍后重试";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateSiteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
    select: { id: true },
  });

  if (!category) {
    return NextResponse.json({ message: "分类不存在" }, { status: 400 });
  }

  const tags = normalizeTagList(parsed.data.tags);

  try {
    const site = await prisma.$transaction(async (tx) => {
      const tagIds = await ensureTagIds(tx, tags);

      return tx.site.update({
        where: { id },
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          url: parsed.data.url,
          coverImageUrl: parsed.data.coverImageUrl || null,
          categoryId: parsed.data.categoryId,
          tags: {
            set: [],
            connect: tagIds.map((tagId) => ({ id: tagId })),
          },
        },
        include: {
          tags: true,
          category: {
            select: {
              id: true,
              name: true,
              style: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ site });
  } catch (error) {
    const message = toSiteUpdateErrorMessage(error);
    const status = message === "站点不存在" ? 404 : 400;
    return NextResponse.json({ message }, { status });
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

  try {
    await prisma.site.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "站点不存在" }, { status: 404 });
  }
}
