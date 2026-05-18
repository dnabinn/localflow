import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.socialAccount.findFirst({
    where: { id, business: { workspace: { members: { some: { userId: user.id } } } } },
  });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.socialAccount.update({
    where: { id },
    data: { isConnected: false, accessToken: null, refreshToken: null, tokenExpiry: null },
  });

  return NextResponse.json({ ok: true });
}
