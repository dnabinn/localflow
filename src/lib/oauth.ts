import crypto from "crypto";

export const FB_API_VERSION = "v21.0";
export const FB_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;
export const FB_SCOPES = [
  "pages_manage_posts",
  "pages_read_engagement",
  "pages_show_list",
  "pages_manage_metadata",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "openid",
  "email",
  "profile",
].join(" ");

export function generateState(): string {
  return crypto.randomBytes(20).toString("hex");
}

export function encodeOAuthCookieData(data: object): string {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

export function decodeOAuthCookieData<T>(encoded: string): T | null {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
