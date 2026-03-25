import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "请选择要删除的分类"),
});

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "参数错误" }, { status: 400 });
  }

  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: parsed.data.ids,
      },
    },
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

  const blocked = categories
    .filter((item) => (item._count.sites ?? 0) > 0 || (item._count.submissions ?? 0) > 0)
    .map((item) => item.id);

  if (blocked.length > 0) {
    return NextResponse.json({ message: "选中分类中包含已有数据的分类，无法批量删除" }, { status: 400 });
  }

  const deletableIds = categories.map((item) => item.id);

  if (deletableIds.length === 0) {
    return NextResponse.json({ message: "没有可删除的分类" }, { status: 400 });
  }

  await prisma.category.deleteMany({
    where: {
      id: {
        in: deletableIds,
      },
    },
  });

  return NextResponse.json({ ok: true, deletedCount: deletableIds.length });
}
