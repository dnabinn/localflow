import type { SocialProvider, PublishPayload, PublishResult, InboxSyncResult } from "./provider.interface";

interface GoogleBusinessConfig {
  accessToken: string;
  accountName: string; // accounts/{accountId}
  locationName: string; // accounts/{accountId}/locations/{locationId}
}

export class GoogleBusinessProvider implements SocialProvider {
  name = "google_business";
  private config: GoogleBusinessConfig;
  private baseUrl = "https://mybusiness.googleapis.com/v4";

  constructor(config: GoogleBusinessConfig) {
    this.config = config;
  }

  async publish(payload: PublishPayload): Promise<PublishResult> {
    try {
      const body: Record<string, unknown> = {
        languageCode: "en-US",
        summary: [payload.caption, payload.cta].filter(Boolean).join("\n\n"),
        topicType: "STANDARD",
      };

      if (payload.mediaUrls?.length) {
        body.media = [{ mediaFormat: "PHOTO", sourceUrl: payload.mediaUrls[0] }];
      }

      const res = await fetch(
        `${this.baseUrl}/${this.config.locationName}/localPosts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error?.message };
      return { success: true, providerPostId: data.name };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async syncInbox(): Promise<InboxSyncResult> {
    try {
      const res = await fetch(
        `${this.baseUrl}/${this.config.locationName}/reviews`,
        {
          headers: { Authorization: `Bearer ${this.config.accessToken}` },
        }
      );
      const data = await res.json();
      if (!res.ok) return { items: [] };

      const items = data.reviews?.map((review: Record<string, unknown>) => ({
        providerItemId: String(review.reviewId),
        authorName: String((review.reviewer as { displayName?: string })?.displayName ?? "Google User"),
        authorAvatarUrl: String((review.reviewer as { profilePhotoUrl?: string })?.profilePhotoUrl ?? ""),
        message: String(review.comment ?? ""),
        receivedAt: new Date(String(review.createTime)),
        metadata: {
          starRating: review.starRating,
          reviewReply: review.reviewReply,
        },
      })) ?? [];

      return { items };
    } catch {
      return { items: [] };
    }
  }

  async refreshToken() {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: this.config.accessToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiry: new Date(Date.now() + data.expires_in * 1000),
    };
  }
}
