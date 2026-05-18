import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load workspace and businesses
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          businesses: {
            select: { id: true, name: true, logoUrl: true },
            take: 20,
          },
        },
      },
    },
  });

  // Create a default workspace if none exists
  if (!workspaceMember) {
    const workspace = await prisma.workspace.create({
      data: {
        name: "My Workspace",
        slug: `ws-${user.id.slice(0, 8)}`,
        members: { create: { userId: user.id, role: "OWNER" } },
      },
    });
    void workspace;
  }

  const workspace = workspaceMember?.workspace ?? {
    name: "My Workspace",
    businesses: [],
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        workspaceName={workspace.name}
        businesses={workspace.businesses}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          userEmail={user.email ?? ""}
          userAvatarUrl={user.user_metadata?.avatar_url}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
