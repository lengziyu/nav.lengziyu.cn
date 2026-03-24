import { CategoryStyle, SubmissionStatus } from "@prisma/client";
import { z } from "zod";

const urlSchema = z.url({ message: "请输入正确的网址，例如 https://example.com" });

export const createSubmissionSchema = z.object({
  title: z.string().trim().min(2, "标题至少 2 个字符").max(120, "标题最多 120 个字符"),
  description: z.string().trim().min(8, "描述至少 8 个字符").max(320, "描述最多 320 个字符"),
  url: urlSchema,
  coverImageUrl: z.union([urlSchema, z.literal(""), z.null()]).optional(),
  categoryId: z.string().cuid("分类无效").optional(),
  tags: z.array(z.string().trim().min(1).max(20)).max(8).default([]),
  contact: z.string().trim().max(80).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "分类名至少 2 个字符").max(24, "分类名最多 24 个字符"),
  description: z.string().trim().max(120).optional(),
  style: z.nativeEnum(CategoryStyle),
});

export const createSiteSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(8).max(320),
  url: urlSchema,
  coverImageUrl: z.union([urlSchema, z.literal(""), z.null()]).optional(),
  categoryId: z.string().cuid(),
  tags: z.array(z.string().trim().min(1).max(20)).max(8).default([]),
});

export const reviewSubmissionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNote: z.string().trim().max(200).optional(),
  categoryId: z.string().cuid().optional(),
});

export const listSubmissionSchema = z.object({
  status: z.nativeEnum(SubmissionStatus).optional(),
});
