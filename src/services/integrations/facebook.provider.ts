import type { SocialProvider, PublishPayload, PublishResult, InboxSyncResult } from "./provider.interface";

interface FacebookProviderConfig {
  accessToken: string;
  pageId: string;
}

export class FacebookProvider implements SocialProvider {
  name = "facebook";
  private config: FacebookProviderConfig;
  private baseUrl = "https://graph.facebook.com/v18.0";

  constructor(config: FacebookProviderConfig) {
    this.config = config;
  }

  async publish(payload: PublishPayload): Promise<PublishResult> {
    try {
      const message = [
        payload.caption,
        payload.hashtags.join(" "),
        payload.cta,
      ].filter(Boolean).join("\n\n");

      if (payload.mediaUrls && payload.mediaUrls.length > 0) {
        const res = await fetch(
          `${this.baseUrl}/${this.config.pageId}/photos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: payload.mediaUrls[0],
              message,
              access_token: this.config.accessToken,
              published: !payload.scheduledAt,
              ...(payload.scheduledAt
                ? { scheduled_publish_time: Math.floor(payload.scheduledAt.getTime() / 1000) }
                : {}),
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.error?.message };
        return { success: true, providerPostId: data.id };
      }

      const res = await fetch(`${this.baseUrl}/${this.config.pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          access_token: this.config.accessToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error?.message };
      return { success: true, providerPostId: data.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async syncInbox(): Promise<InboxSyncResult> {
    try {
      const res = await fetch(
        `${this.baseUrl}/${this.config.pageId}/conversations?access_token=${this.config.accessToken}&fields=messages{from,message,created_time}`
      );
      const data = await res.json();
      if (!res.ok) return { items: [] };

      const items = data.data?.flatMap((conv: Record<string, unknown>) => {
        const messages = (conv.messages as { data?: Record<string, unknown>[] })?.data ?? [];
        return messages.map((msg) => ({
          providerItemId: String(msg.id),
          authorName: (msg.from as { name?: string })?.name ?? "Unknown",
          message: String(msg.message ?? ""),
          receivedAt: new Date(String(msg.created_time)),
        }));
      }) ?? [];

      return { items };
    } catch {
      return { items: [] };
    }
  }

  async refreshToken() {
    const res = await fetch(
      `${this.baseUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${this.config.accessToken}`
    );
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiry: new Date(Date.now() + data.expires_in * 1000),
    };
  }
}
