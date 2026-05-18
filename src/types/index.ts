export type { Workspace, Business, Location, SocialAccount, Post, PostTarget, PostMedia, MediaFile, InboxItem, AiUsageLog } from "@prisma/client";
export { WorkspaceRole, BrandTone, SocialProvider, PostType, PostStatus, Sentiment } from "@prisma/client";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface WorkspaceWithMembers {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: string;
}

export interface BusinessWithAccounts {
  id: string;
  name: string;
  logoUrl: string | null;
  brandTone: string;
  timezone: string;
  preferredLanguage: string;
  socialAccounts: {
    id: string;
    provider: string;
    name: string | null;
    isConnected: boolean;
  }[];
}

export interface InboxItemWithBusiness {
  id: string;
  provider: string;
  authorName: string;
  authorAvatarUrl: string | null;
  message: string;
  sentiment: string;
  isResolved: boolean;
  isRead: boolean;
  aiSuggestedReply: string | null;
  receivedAt: Date;
  business: {
    id: string;
    name: string;
  };
}

export interface PostWithTargets {
  id: string;
  caption: string;
  hashtags: string[];
  postType: string;
  status: string;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  targets: {
    id: string;
    status: string;
    socialAccount: {
      provider: string;
      name: string | null;
    };
  }[];
  media: {
    id: string;
    sortOrder: number;
    file: {
      url: string;
      mimeType: string;
    };
  }[];
}

export interface DashboardStats {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  unreadInboxItems: number;
  totalMediaFiles: number;
  connectedAccounts: number;
}

export type NavItem = {
  title: string;
  href: string;
  icon: string;
  badge?: number;
};
