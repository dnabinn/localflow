import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { decodeOAuthCookieData } from "@/lib/oauth";
import type { FbPage } from "../callback/route";

interface OAuthFbData {
  pages: FbPage[];
  businessId: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieVal = req.cookies.get("oauth_fb_data")?.value;
  if (!cookieVal) return NextResponse.json({ error: "Session expired" }, { status: 400 });

  const oauthData = decodeOAuthCookieData<OAuthFbData>(cookieVal);
  if (!oauthData) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

  const { pageId } = await req.json();
  const page = oauthData.pages.find((p) => p.id === pageId);
  if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

  const { businessId } = oauthData;

  const business = await prisma.business.findFirst({
    where: { id: businessId, workspace: { members: { some: { userId: user.id } } } },
  });
  if (!business) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Save Facebook Page account
  await prisma.socialAccount.upsert({
    where: { businessId_provider: { businessId, provider: "FACEBOOK" } },
    create: {
      businessId,
      provider: "FACEBOOK",
      providerAccountId: page.id,
      name: page.name,
      accessToken: page.access_token,
      isConnected: true,
    },
    update: {
      providerAccountId: page.id,
      name: page.name,
      accessToken: page.access_token,
      isConnected: true,
    },
  });

  // If page has an Instagram Business account, connect it too (same page token)
  const ig = page.instagram_business_account;
  if (ig) {
    await prisma.socialAccount.upsert({
      where: { businessId_provider: { businessId, provider: "INSTAGRAM" } },
      create: {
        businessId,
        provider: "INSTAGRAM",
        providerAccountId: ig.id,
        name: ig.name ?? ig.username,
        avatarUrl: ig.profile_picture_url ?? null,
        accessToken: page.access_token,
        isConnected: true,
        metadata: { username: ig.username } as Prisma.InputJsonValue,
      },
      update: {
        providerAccountId: ig.id,
        name: ig.name ?? ig.username,
        avatarUrl: ig.profile_picture_url ?? null,
        accessToken: page.access_token,
        isConnected: true,
        metadata: { username: ig.username } as Prisma.InputJsonValue,
      },
    });
  }

  const res = NextResponse.json({ ok: true, instagram: !!ig });
  res.cookies.delete("oauth_fb_data");
  return res;
}
