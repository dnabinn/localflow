import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1),
  timezone: z.string().default("America/New_York"),
  preferredLanguage: z.string().default("en"),
  brandTone: z.enum(["CALM", "LUXURY", "TRADITIONAL", "MODERN", "FRIENDLY", "PROFESSIONAL"]).default("FRIENDLY"),
  website: z.string().url().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: parsed.data.workspaceId, userId: user.id },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const business = await prisma.business.create({ data: parsed.data });
  return NextResponse.json({ data: business }, { status: 201 });
}
