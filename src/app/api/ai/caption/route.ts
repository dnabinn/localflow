import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateCaption } from "@/services/ai.service";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  businessName: z.string().min(1),
  tone: z.string().default("FRIENDLY"),
  postType: z.string().default("SINGLE_IMAGE"),
  language: z.string().optional(),
  context: z.string().optional(),
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
    const caption = await generateCaption({
      ...parsed.data,
      workspaceId: body.workspaceId,
    });
    return NextResponse.json({ caption });
  } catch (error) {
    console.error("AI caption error:", error);
    return NextResponse.json({ error: "Failed to generate caption" }, { status: 500 });
  }
}
