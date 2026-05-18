import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ComposerClient } from "@/components/composer/composer-client";

export const metadata: Metadata = { title: "Compose" };

export default async function ComposePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });
  if (!workspaceMember) redirect("/login");

  const businesses = await prisma.business.findMany({
    where: { workspaceId: workspaceMember.workspaceId },
    include: {
      socialAccounts: {
        select: { id: true, provider: true, name: true, isConnected: true },
      },
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Compose</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create and schedule content across your platforms
        </p>
      </div>
      <ComposerClient
        businesses={businesses}
        workspaceId={workspaceMember.workspaceId}
      />
    </div>
  );
}
