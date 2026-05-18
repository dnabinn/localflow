import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { InboxClient } from "@/components/inbox/inbox-client";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });
  if (!workspaceMember) redirect("/login");

  const items = await prisma.inboxItem.findMany({
    where: { workspaceId: workspaceMember.workspaceId },
    include: { business: { select: { id: true, name: true } } },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Inbox</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage reviews, comments, and messages from all platforms
        </p>
      </div>
      <InboxClient items={items} />
    </div>
  );
}
