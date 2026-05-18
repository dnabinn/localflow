import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  workspaceId: z.string(),
  businessId: z.string(),
  provider: z.enum(["FACEBOOK", "INSTAGRAM", "GOOGLE_BUSINESS", "TIKTOK"]),
  authorName: z.string(),
  message: z.string(),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]).optional(),
  providerItemId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const resolved = searchParams.get("resolved");
  const provider = searchParams.get("provider");

  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

  const items = await prisma.inboxItem.findMany({
    where: {
      workspaceId,
      ...(resolved !== null ? { isResolved: resolved === "true" } : {}),
      ...(provider ? { provider: provider as "FACEBOOK" | "INSTAGRAM" | "GOOGLE_BUSINESS" | "TIKTOK" } : {}),
    },
    include: { business: { select: { id: true, name: true } } },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { metadata, ...rest } = parsed.data;
  const item = await prisma.inboxItem.create({
    data: {
      ...rest,
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
  });
  return NextResponse.json({ data: item }, { status: 201 });
}
