import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateState, GOOGLE_SCOPES, getAppUrl } from "@/lib/oauth";

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
  const redirectUri = `${getAppUrl()}/api/auth/google/callback`;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", GOOGLE_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("oauth_google_state", `${state}:${businessId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 900,
    path: "/",
  });
  return res;
}
