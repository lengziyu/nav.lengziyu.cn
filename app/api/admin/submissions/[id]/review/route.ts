import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFallbackColor, normalizeTagList, slugify } from "@/lib/utils";
import { reviewSubmissionSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = reviewSubmissionSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
  });

  if (!submission) {
    return NextResponse.json({ message: "投稿不存在" }, { status: 404 });
  }

  if (submission.status !== "PENDING") {
    return NextResponse.json({ message: "该投稿已审核" }, { status: 400 });
  }

  const reviewNote = parsed.data.reviewNote || null;

  if (parsed.data.action === "reject") {
    const updated = await prisma.submission.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewNote,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ submission: updated });
  }

  const categoryId = parsed.data.categoryId ?? submission.categoryId;

  if (!categoryId) {
    return NextResponse.json({ message: "请指定分类后再通过" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    return NextResponse.json({ message: "分类不存在" }, { status: 400 });
  }

  const tags = normalizeTagList(submission.tags);

  const result = await prisma.$transaction(async (tx) => {
    const site = await tx.site.create({
      data: {
        title: submission.title,
        description: submission.description,
        url: submission.url,
        coverImageUrl: submission.coverImageUrl,
        fallbackColor: submission.fallbackColor || getFallbackColor(submission.title),
        categoryId,
        publisherType: "GUEST",
        publisherName: submission.proposerName,
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
      },
    });

    const reviewedSubmission = await tx.submission.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewNote,
        reviewedAt: new Date(),
        categoryId,
      },
    });

    return {
      site,
      submission: reviewedSubmission,
    };
  });

  return NextResponse.json(result);
}
