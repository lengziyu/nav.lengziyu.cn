import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeTagList, slugify } from "@/lib/utils";
import { updateSiteSchema } from "@/lib/validators";

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
    const site = await prisma.site.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        url: parsed.data.url,
        coverImageUrl: parsed.data.coverImageUrl || null,
        categoryId: parsed.data.categoryId,
        tags: {
          set: [],
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag },
            create: {
              name: tag,
              slug: slugify(tag) || `tag-${Math.random().toString(36).slice(2, 10)}`,
            },
          })),
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

    return NextResponse.json({ site });
  } catch {
    return NextResponse.json({ message: "站点不存在" }, { status: 404 });
  }
}
