import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureTagIds } from "@/lib/tag-helpers";
import { createSiteSchema } from "@/lib/validators";
import { getFallbackColor, normalizeTagList } from "@/lib/utils";

export const dynamic = "force-dynamic";

function toSiteCreateErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "数据冲突，请检查 URL 或标签后重试";
    }
    if (error.code === "P2003") {
      return "分类不存在或已失效，请刷新页面后重试";
    }
  }
  return "发布失败，请稍后重试";
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const sites = await prisma.site.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { views: "desc" }, { likes: "desc" }],
    include: {
      category: {
        select: {
          id: true,
          name: true,
          style: true,
        },
      },
      tags: true,
    },
  });

  return NextResponse.json({ sites });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createSiteSchema.safeParse(json);

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

      return tx.site.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          url: parsed.data.url,
          categoryId: parsed.data.categoryId,
          coverImageUrl: parsed.data.coverImageUrl || null,
          fallbackColor: getFallbackColor(parsed.data.title),
          publisherType: "ADMIN",
          publisherName: "管理员",
          tags: {
            connect: tagIds.map((id) => ({ id })),
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
    return NextResponse.json({ message: toSiteCreateErrorMessage(error) }, { status: 400 });
  }
}
