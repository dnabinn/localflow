import type { SocialProvider, PublishPayload, PublishResult, InboxSyncResult } from "./provider.interface";

interface InstagramProviderConfig {
  accessToken: string;
  igUserId: string;
}

export class InstagramProvider implements SocialProvider {
  name = "instagram";
  private config: InstagramProviderConfig;
  private baseUrl = "https://graph.facebook.com/v18.0";

  constructor(config: InstagramProviderConfig) {
    this.config = config;
  }

  async publish(payload: PublishPayload): Promise<PublishResult> {
    try {
      const caption = [
        payload.caption,
        payload.hashtags.join(" "),
        payload.cta,
      ].filter(Boolean).join("\n\n");

      if (!payload.mediaUrls?.length) {
        return { success: false, error: "Instagram requires at least one media URL" };
      }

      // Step 1: Create media container
      const isCarousel = payload.mediaUrls.length > 1;

      if (isCarousel) {
        const childIds: string[] = [];
        for (const url of payload.mediaUrls) {
          const childRes = await fetch(`${this.baseUrl}/${this.config.igUserId}/media`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: url,
              is_carousel_item: true,
              access_token: this.config.accessToken,
            }),
          });
          const childData = await childRes.json();
          if (!childRes.ok) return { success: false, error: childData.error?.message };
          childIds.push(childData.id);
        }

        const carouselRes = await fetch(`${this.baseUrl}/${this.config.igUserId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            media_type: "CAROUSEL",
            children: childIds.join(","),
            caption,
            access_token: this.config.accessToken,
          }),
        });
        const carouselData = await carouselRes.json();
        if (!carouselRes.ok) return { success: false, error: carouselData.error?.message };

        const publishRes = await fetch(`${this.baseUrl}/${this.config.igUserId}/media_publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: carouselData.id,
            access_token: this.config.accessToken,
          }),
        });
        const publishData = await publishRes.json();
        if (!publishRes.ok) return { success: false, error: publishData.error?.message };
        return { success: true, providerPostId: publishData.id };
      }

      const containerRes = await fetch(`${this.baseUrl}/${this.config.igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: payload.mediaUrls[0],
          caption,
          access_token: this.config.accessToken,
        }),
      });
      const containerData = await containerRes.json();
      if (!containerRes.ok) return { success: false, error: containerData.error?.message };

      const publishRes = await fetch(`${this.baseUrl}/${this.config.igUserId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: this.config.accessToken,
        }),
      });
      const publishData = await publishRes.json();
      if (!publishRes.ok) return { success: false, error: publishData.error?.message };
      return { success: true, providerPostId: publishData.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async syncInbox(): Promise<InboxSyncResult> {
    try {
      const res = await fetch(
        `${this.baseUrl}/${this.config.igUserId}/mentions?access_token=${this.config.accessToken}`
      );
      const data = await res.json();
      if (!res.ok) return { items: [] };

      const items = data.data?.map((mention: Record<string, unknown>) => ({
        providerItemId: String(mention.id),
        authorName: String((mention.username as string) ?? "Instagram User"),
        message: String(mention.text ?? ""),
        receivedAt: new Date(String(mention.timestamp)),
      })) ?? [];

      return { items };
    } catch {
      return { items: [] };
    }
  }

  async refreshToken() {
    const res = await fetch(
      `${this.baseUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${this.config.accessToken}`
    );
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiry: new Date(Date.now() + data.expires_in * 1000),
    };
  }
}
