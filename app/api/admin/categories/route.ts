import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { createCategorySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: {
        select: {
          sites: true,
          submissions: true,
        },
      },
    },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const count = await prisma.category.count();
  const slugBase = slugify(parsed.data.name) || `category-${Date.now()}`;

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: `${slugBase}-${Date.now().toString().slice(-4)}`,
      description: parsed.data.description || null,
      style: parsed.data.style,
      sortOrder: count,
    },
  });

  return NextResponse.json({ category });
}
