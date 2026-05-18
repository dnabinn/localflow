import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { MediaLibraryClient } from "@/components/media/media-library-client";

export const metadata: Metadata = { title: "Media Library" };

export default async function MediaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });
  if (!workspaceMember) redirect("/login");

  const files = await prisma.mediaFile.findMany({
    where: { workspaceId: workspaceMember.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Media Library</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage images, videos, and reels for your content
        </p>
      </div>
      <MediaLibraryClient
        files={files}
        workspaceId={workspaceMember.workspaceId}
      />
    </div>
  );
}
