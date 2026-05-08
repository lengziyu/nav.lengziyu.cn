import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listSubmissionSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const query = listSubmissionSchema.safeParse({
    status: request.nextUrl.searchParams.get("status") ?? undefined,
  });

  if (!query.success) {
    return NextResponse.json({ message: "状态参数错误" }, { status: 400 });
  }

  const submissions = await prisma.submission.findMany({
    where: {
      status: query.data.status,
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      category: {
        select: {
          id: true,
          name: true,
          style: true,
        },
      },
    },
  });

  return NextResponse.json({ submissions });
}
