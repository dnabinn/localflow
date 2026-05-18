import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NewBusinessForm } from "@/components/settings/new-business-form";

export const metadata: Metadata = { title: "Add Business" };

export default async function NewBusinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });
  if (!workspaceMember) redirect("/login");

  return (
    <div className="p-6 max-w-xl mx-auto animate-fade-in">
      <div className="mb-6">
        <a href="/settings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Settings
        </a>
        <h2 className="text-xl font-semibold mt-3">Add Business</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add a business to start managing its content and reputation.
        </p>
      </div>
      <NewBusinessForm workspaceId={workspaceMember.workspaceId} />
    </div>
  );
}
