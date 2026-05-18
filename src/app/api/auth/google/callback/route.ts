import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/oauth";

interface GmbAccount {
  name: string;
  accountName: string;
  type: string;
  verificationState: string;
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

  const storedState = req.cookies.get("oauth_google_state")?.value;
  if (!storedState) return NextResponse.redirect(`${failUrl}&error=missing_state`);

  const colonIdx = storedState.indexOf(":");
  const savedState = storedState.slice(0, colonIdx);
  const businessId = storedState.slice(colonIdx + 1);

  if (savedState !== state || !businessId) {
    const res = NextResponse.redirect(`${failUrl}&error=invalid_state`);
    res.cookies.delete("oauth_google_state");
    return res;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    const res = NextResponse.redirect(`${failUrl}&error=token_exchange_failed`);
    res.cookies.delete("oauth_google_state");
    return res;
  }

  // Fetch Google Business Profile accounts
  const accountsRes = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const accountsData = await accountsRes.json();
  const accounts: GmbAccount[] = accountsData.accounts ?? [];

  const primary = accounts[0];

  await prisma.socialAccount.upsert({
    where: { businessId_provider: { businessId, provider: "GOOGLE_BUSINESS" } },
    create: {
      businessId,
      provider: "GOOGLE_BUSINESS",
      providerAccountId: primary?.name ?? null,
      name: primary?.accountName ?? "Google Business Profile",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      tokenExpiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
      isConnected: true,
      metadata: { accounts } as Prisma.InputJsonValue,
    },
    update: {
      providerAccountId: primary?.name ?? null,
      name: primary?.accountName ?? "Google Business Profile",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      tokenExpiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
      isConnected: true,
      metadata: { accounts } as Prisma.InputJsonValue,
    },
  });

  const res = NextResponse.redirect(`${appUrl}/settings?tab=integrations&connected=google`);
  res.cookies.delete("oauth_google_state");
  return res;
}
