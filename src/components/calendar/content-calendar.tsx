"use client";

import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, truncate } from "@/lib/utils";

interface PostItem {
  id: string;
  caption: string;
  status: string;
  scheduledAt: Date | null;
  business: { name: string };
  targets: { socialAccount: { provider: string } }[];
}

interface ContentCalendarProps {
  posts: PostItem[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  SCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export function ContentCalendar({ posts }: ContentCalendarProps) {
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function postsForDay(day: Date) {
    return posts.filter(
      (p) => p.scheduledAt && isSameDay(new Date(p.scheduledAt), day)
    );
  }

  const allScheduled = posts.filter((p) => p.status !== "DRAFT");

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-semibold min-w-[140px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs px-3">Month</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3">Week</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
            <Link href="/compose">
              <Plus className="h-3.5 w-3.5" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayPosts = postsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[100px] p-1.5 border-b border-r last:border-r-0",
                  !isCurrentMonth && "bg-muted/20",
                  i % 7 === 6 && "border-r-0",
                  i >= days.length - 7 && "border-b-0"
                )}
              >
                <div className={cn(
                  "h-6 w-6 flex items-center justify-center rounded-full text-xs font-medium mb-1",
                  isToday ? "bg-primary text-primary-foreground" : "",
                  !isCurrentMonth ? "text-muted-foreground/50" : "text-foreground"
                )}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer",
                        STATUS_COLORS[post.status] ?? STATUS_COLORS.DRAFT
                      )}
                      title={post.caption}
                    >
                      {truncate(post.caption, 24)}
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post list below calendar */}
      {allScheduled.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Upcoming Posts</h3>
          </div>
          <div className="divide-y">
            {allScheduled.slice(0, 10).map((post) => (
              <div key={post.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <Badge
                  variant="outline"
                  className={cn("text-xs shrink-0", STATUS_COLORS[post.status])}
                >
                  {post.status.toLowerCase()}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{post.caption}</p>
                  <p className="text-xs text-muted-foreground">{post.business.name}</p>
                </div>
                {post.scheduledAt && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(post.scheduledAt), "MMM d, h:mm a")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
