import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: params.id,
      members: { some: { userId: user.id } },
    },
    include: {
      businesses: true,
      members: true,
    },
  });

  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: workspace });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: params.id, userId: user.id, role: { in: ["OWNER", "ADMIN"] } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const workspace = await prisma.workspace.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ data: workspace });
}
