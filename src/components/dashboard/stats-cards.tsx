import { FileText, Clock, CheckCircle2, MessageSquare, Image, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

const statConfig = [
  {
    key: "totalPosts" as const,
    label: "Total Posts",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    key: "scheduledPosts" as const,
    label: "Scheduled",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    key: "publishedPosts" as const,
    label: "Published",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    key: "unreadInboxItems" as const,
    label: "Unread Messages",
    icon: MessageSquare,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/40",
  },
  {
    key: "totalMediaFiles" as const,
    label: "Media Files",
    icon: Image,
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/40",
  },
  {
    key: "connectedAccounts" as const,
    label: "Connected Accounts",
    icon: Link2,
    color: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      {statConfig.map(({ key, label, icon: Icon, color, bg }) => (
        <Card key={key} className="border-border/60">
          <CardContent className="p-4">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="text-2xl font-semibold tabular-nums">{stats[key]}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
