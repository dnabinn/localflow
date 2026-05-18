export interface PublishPayload {
  caption: string;
  hashtags: string[];
  cta?: string;
  mediaUrls?: string[];
  scheduledAt?: Date;
}

export interface PublishResult {
  success: boolean;
  providerPostId?: string;
  error?: string;
}

export interface InboxSyncResult {
  items: {
    providerItemId: string;
    authorName: string;
    authorAvatarUrl?: string;
    message: string;
    receivedAt: Date;
    metadata?: Record<string, unknown>;
  }[];
}

export interface SocialProvider {
  name: string;
  publish(payload: PublishPayload): Promise<PublishResult>;
  syncInbox(): Promise<InboxSyncResult>;
  refreshToken(): Promise<{ accessToken: string; refreshToken?: string; expiry?: Date }>;
}
