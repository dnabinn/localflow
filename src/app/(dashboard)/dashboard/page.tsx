import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ConnectedPlatforms } from "@/components/dashboard/connected-platforms";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });

  if (!workspaceMember) redirect("/login");
  const { workspaceId } = workspaceMember;

  const [
    totalPosts,
    scheduledPosts,
    publishedPosts,
    unreadInbox,
    totalMedia,
    connectedAccounts,
    recentPosts,
    recentInbox,
  ] = await Promise.all([
    prisma.post.count({ where: { workspaceId } }),
    prisma.post.count({ where: { workspaceId, status: "SCHEDULED" } }),
    prisma.post.count({ where: { workspaceId, status: "PUBLISHED" } }),
    prisma.inboxItem.count({ where: { workspaceId, isRead: false } }),
    prisma.mediaFile.count({ where: { workspaceId } }),
    prisma.socialAccount.count({ where: { business: { workspaceId } }, }),
    prisma.post.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { business: { select: { name: true } } },
    }),
    prisma.inboxItem.findMany({
      where: { workspaceId },
      orderBy: { receivedAt: "desc" },
      take: 5,
      include: { business: { select: { name: true } } },
    }),
  ]);

  const stats = {
    totalPosts,
    scheduledPosts,
    publishedPosts,
    unreadInboxItems: unreadInbox,
    totalMediaFiles: totalMedia,
    connectedAccounts,
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-semibold">Overview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityFeed posts={recentPosts} inboxItems={recentInbox} />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <ConnectedPlatforms count={connectedAccounts} />
        </div>
      </div>
    </div>
  );
}
