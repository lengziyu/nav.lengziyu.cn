import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSiteSchema } from "@/lib/validators";
import { getFallbackColor, normalizeTagList, slugify } from "@/lib/utils";

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

  const site = await prisma.site.create({
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
}
