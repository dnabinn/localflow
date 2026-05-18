import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const createPostSchema = z.object({
  workspaceId: z.string(),
  businessId: z.string(),
  caption: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  cta: z.string().optional(),
  postType: z.enum(["SINGLE_IMAGE", "CAROUSEL", "REEL", "VIDEO", "TEXT", "GOOGLE_UPDATE"]).default("SINGLE_IMAGE"),
  status: z.enum(["DRAFT", "SCHEDULED"]).default("DRAFT"),
  scheduledAt: z.string().optional(),
  targetAccountIds: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const status = searchParams.get("status");

  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const posts = await prisma.post.findMany({
    where: {
      workspaceId,
      ...(status ? { status: status as "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED" } : {}),
    },
    include: {
      business: { select: { name: true } },
      targets: {
        include: { socialAccount: { select: { provider: true, name: true } } },
      },
      media: {
        include: { file: { select: { url: true, mimeType: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ data: posts });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const { workspaceId, businessId, caption, hashtags, cta, postType, status, scheduledAt, targetAccountIds } = parsed.data;

  const post = await prisma.post.create({
    data: {
      workspaceId,
      businessId,
      caption,
      hashtags,
      cta,
      postType,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      targets: {
        create: targetAccountIds.map((socialAccountId) => ({
          socialAccountId,
          status,
        })),
      },
    },
    include: {
      targets: { include: { socialAccount: { select: { provider: true, name: true } } } },
    },
  });

  return NextResponse.json({ data: post }, { status: 201 });
}
