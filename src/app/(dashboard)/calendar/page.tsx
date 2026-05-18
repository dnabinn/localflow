import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ContentCalendar } from "@/components/calendar/content-calendar";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });
  if (!workspaceMember) redirect("/login");

  const posts = await prisma.post.findMany({
    where: { workspaceId: workspaceMember.workspaceId },
    include: {
      business: { select: { name: true } },
      targets: {
        include: { socialAccount: { select: { provider: true } } },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Content Calendar</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          View and manage your scheduled content
        </p>
      </div>
      <ContentCalendar posts={posts} />
    </div>
  );
}
