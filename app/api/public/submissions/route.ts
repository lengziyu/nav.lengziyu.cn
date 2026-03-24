import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSubmissionSchema } from "@/lib/validators";
import { getFallbackColor, normalizeTagList, pickGuestAlias } from "@/lib/utils";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createSubmissionSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "参数错误",
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json({ message: "分类不存在" }, { status: 400 });
    }
  }

  const tags = normalizeTagList(payload.tags);

  const submission = await prisma.submission.create({
    data: {
      title: payload.title,
      description: payload.description,
      url: payload.url,
      coverImageUrl: payload.coverImageUrl || null,
      fallbackColor: getFallbackColor(payload.title),
      proposerName: pickGuestAlias(`${payload.title}:${payload.url}:${Date.now()}`),
      contact: payload.contact?.trim() || null,
      categoryId: payload.categoryId ?? null,
      tags,
    },
    select: { id: true },
  });

  return NextResponse.json({
    id: submission.id,
    message: "推荐提交成功，管理员审核后会展示。",
  });
}
