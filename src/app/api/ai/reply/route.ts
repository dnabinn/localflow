import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateReply } from "@/services/ai.service";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  message: z.string().min(1),
  platform: z.string(),
  businessName: z.string().min(1),
  tone: z.string().optional(),
  language: z.string().optional(),
  businessId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const reply = await generateReply({
      ...parsed.data,
      workspaceId: body.workspaceId,
    });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI reply error:", error);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}
