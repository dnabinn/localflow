import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/settings/settings-client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          businesses: {
            include: {
              socialAccounts: true,
              locations: true,
            },
          },
        },
      },
    },
  });
  if (!workspaceMember) redirect("/login");

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your workspace, businesses, and integrations
        </p>
      </div>
      <SettingsClient
        workspace={workspaceMember.workspace}
        businesses={workspaceMember.workspace.businesses}
        userEmail={user.email ?? ""}
      />
    </div>
  );
}
