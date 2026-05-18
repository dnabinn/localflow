import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateHashtags } from "@/services/ai.service";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  caption: z.string().min(1),
  postType: z.string().default("SINGLE_IMAGE"),
  count: z.number().min(1).max(30).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const hashtags = await generateHashtags(parsed.data);
    return NextResponse.json({ hashtags });
  } catch (error) {
    console.error("AI hashtags error:", error);
    return NextResponse.json({ error: "Failed to generate hashtags" }, { status: 500 });
  }
}
