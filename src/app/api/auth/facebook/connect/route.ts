import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateState, FB_API_VERSION, FB_SCOPES, getAppUrl } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const business = await prisma.business.findFirst({
    where: { id: businessId, workspace: { members: { some: { userId: user.id } } } },
  });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const state = generateState();
  const redirectUri = `${getAppUrl()}/api/auth/facebook/callback`;

  const url = new URL(`https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", FB_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("oauth_fb_state", `${state}:${businessId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 900,
    path: "/",
  });
  return res;
}
