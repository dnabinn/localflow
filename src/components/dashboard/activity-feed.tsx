import { formatRelativeTime, truncate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare } from "lucide-react";

interface Post {
  id: string;
  caption: string;
  status: string;
  createdAt: Date;
  business: { name: string };
}

interface InboxItem {
  id: string;
  message: string;
  authorName: string;
  provider: string;
  receivedAt: Date;
  business: { name: string };
}

interface ActivityFeedProps {
  posts: Post[];
  inboxItems: InboxItem[];
}

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  DRAFT: "secondary",
  SCHEDULED: "warning",
  PUBLISHED: "success",
  FAILED: "destructive",
};

export function ActivityFeed({ posts, inboxItems }: ActivityFeedProps) {
  const activities = [
    ...posts.map((p) => ({ type: "post" as const, data: p, time: p.createdAt })),
    ...inboxItems.map((i) => ({ type: "inbox" as const, data: i, time: i.receivedAt })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="px-6 pb-6 text-sm text-muted-foreground">
            No activity yet. Create your first post to get started.
          </div>
        ) : (
          <div className="divide-y">
            {activities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                <div className={`mt-0.5 p-1.5 rounded-md ${activity.type === "post" ? "bg-blue-50 dark:bg-blue-950/40" : "bg-purple-50 dark:bg-purple-950/40"}`}>
                  {activity.type === "post"
                    ? <FileText className="h-3.5 w-3.5 text-blue-500" />
                    : <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {activity.type === "post"
                        ? truncate(activity.data.caption, 60)
                        : `${activity.data.authorName}: ${truncate(activity.data.message, 50)}`
                      }
                    </span>
                    {activity.type === "post" && (
                      <Badge variant={statusVariant[activity.data.status] ?? "secondary"} className="shrink-0">
                        {activity.data.status.toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{activity.data.business.name}</span>
                    {activity.type === "inbox" && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {activity.data.provider.toLowerCase().replace("_", " ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeTime(activity.time)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
