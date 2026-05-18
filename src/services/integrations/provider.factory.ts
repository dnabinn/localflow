import { FacebookProvider } from "./facebook.provider";
import { InstagramProvider } from "./instagram.provider";
import { GoogleBusinessProvider } from "./google-business.provider";
import type { SocialProvider } from "./provider.interface";

interface ProviderAccount {
  provider: string;
  accessToken: string | null;
  refreshToken: string | null;
  metadata: Record<string, unknown> | null;
}

export function createProvider(account: ProviderAccount): SocialProvider | null {
  if (!account.accessToken) return null;

  const meta = account.metadata ?? {};

  switch (account.provider) {
    case "FACEBOOK":
      return new FacebookProvider({
        accessToken: account.accessToken,
        pageId: String(meta.pageId ?? ""),
      });

    case "INSTAGRAM":
      return new InstagramProvider({
        accessToken: account.accessToken,
        igUserId: String(meta.igUserId ?? ""),
      });

    case "GOOGLE_BUSINESS":
      return new GoogleBusinessProvider({
        accessToken: account.accessToken,
        accountName: String(meta.accountName ?? ""),
        locationName: String(meta.locationName ?? ""),
      });

    default:
      return null;
  }
}
