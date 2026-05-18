import { schedules } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { createProvider } from "@/services/integrations/provider.factory";

export const publishScheduledPosts = schedules.task({
  id: "publish-scheduled-posts",
  cron: "*/5 * * * *", // Every 5 minutes
  run: async () => {
    const now = new Date();

    const pendingPosts = await prisma.postTarget.findMany({
      where: {
        status: "SCHEDULED",
        post: {
          status: "SCHEDULED",
          scheduledAt: { lte: now },
        },
      },
      include: {
        post: {
          include: {
            media: { include: { file: true }, orderBy: { sortOrder: "asc" } },
          },
        },
        socialAccount: true,
      },
      take: 20,
    });

    for (const target of pendingPosts) {
      const provider = createProvider({
        provider: target.socialAccount.provider,
        accessToken: target.socialAccount.accessToken,
        refreshToken: target.socialAccount.refreshToken,
        metadata: target.socialAccount.metadata as Record<string, unknown> | null,
      });

      if (!provider) {
        await prisma.postTarget.update({
          where: { id: target.id },
          data: { status: "FAILED", errorLog: "Provider not configured" },
        });
        continue;
      }

      try {
        const result = await provider.publish({
          caption: target.post.caption,
          hashtags: target.post.hashtags,
          cta: target.post.cta ?? undefined,
          mediaUrls: target.post.media.map((m) => m.file.url),
          scheduledAt: target.post.scheduledAt ?? undefined,
        });

        await prisma.postTarget.update({
          where: { id: target.id },
          data: {
            status: result.success ? "PUBLISHED" : "FAILED",
            publishedAt: result.success ? new Date() : undefined,
            providerPostId: result.providerPostId,
            errorLog: result.error,
          },
        });
      } catch (err) {
        await prisma.postTarget.update({
          where: { id: target.id },
          data: { status: "FAILED", errorLog: String(err) },
        });
      }
    }

    // Mark posts fully published if all targets are done
    const postIds = [...new Set(pendingPosts.map((t) => t.postId))];
    for (const postId of postIds) {
      const targets = await prisma.postTarget.findMany({ where: { postId } });
      const allDone = targets.every((t) => t.status === "PUBLISHED" || t.status === "FAILED");
      const anyPublished = targets.some((t) => t.status === "PUBLISHED");
      if (allDone) {
        await prisma.post.update({
          where: { id: postId },
          data: {
            status: anyPublished ? "PUBLISHED" : "FAILED",
            publishedAt: anyPublished ? new Date() : undefined,
          },
        });
      }
    }

    return { processed: pendingPosts.length };
  },
});
