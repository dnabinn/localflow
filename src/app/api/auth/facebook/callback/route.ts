import { NextRequest, NextResponse } from "next/server";
import { FB_BASE, encodeOAuthCookieData, getAppUrl } from "@/lib/oauth";

export interface FbPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    name: string;
    username: string;
    profile_picture_url?: string;
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = getAppUrl();
  const failUrl = `${appUrl}/settings?tab=integrations`;

  if (error || !code || !state) {
    return NextResponse.redirect(`${failUrl}&error=${error ?? "oauth_cancelled"}`);
  }

  const storedState = req.cookies.get("oauth_fb_state")?.value;
  if (!storedState) return NextResponse.redirect(`${failUrl}&error=missing_state`);

  const colonIdx = storedState.indexOf(":");
  const savedState = storedState.slice(0, colonIdx);
  const businessId = storedState.slice(colonIdx + 1);

  if (savedState !== state || !businessId) {
    const res = NextResponse.redirect(`${failUrl}&error=invalid_state`);
    res.cookies.delete("oauth_fb_state");
    return res;
  }

  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = `${appUrl}/api/auth/facebook/callback`;

  // Exchange code for short-lived token
  const tokenRes = await fetch(
    `${FB_BASE}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  );
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    const res = NextResponse.redirect(`${failUrl}&error=token_exchange_failed`);
    res.cookies.delete("oauth_fb_state");
    return res;
  }

  // Exchange for long-lived token (~60 days)
  const longTokenRes = await fetch(
    `${FB_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
  );
  const longTokenData = await longTokenRes.json();
  const userToken = longTokenData.access_token ?? tokenData.access_token;

  // Fetch pages with linked Instagram Business accounts
  const pagesRes = await fetch(
    `${FB_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account%7Bid,name,username,profile_picture_url%7D&access_token=${userToken}`
  );
  const pagesData = await pagesRes.json();
  const pages: FbPage[] = pagesData.data ?? [];

  if (pages.length === 0) {
    const res = NextResponse.redirect(`${failUrl}&error=no_pages`);
    res.cookies.delete("oauth_fb_state");
    return res;
  }

  // Store pages + businessId in short-lived cookie for the picker
  const cookieData = encodeOAuthCookieData({ pages, businessId });
  const pickerUrl = `${appUrl}/settings/connect/facebook`;

  const res = NextResponse.redirect(pickerUrl);
  res.cookies.set("oauth_fb_data", cookieData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  res.cookies.delete("oauth_fb_state");
  return res;
}
