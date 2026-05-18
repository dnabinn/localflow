"use client";

import { useState } from "react";
import { Facebook, Instagram, MapPin, Wand2, Loader2, CheckCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";

interface InboxItemData {
  id: string;
  provider: string;
  authorName: string;
  authorAvatarUrl: string | null;
  message: string;
  sentiment: string;
  isResolved: boolean;
  isRead: boolean;
  aiSuggestedReply: string | null;
  receivedAt: Date;
  business: { id: string; name: string };
}

interface InboxClientProps {
  items: InboxItemData[];
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  FACEBOOK: Facebook,
  INSTAGRAM: Instagram,
  GOOGLE_BUSINESS: MapPin,
};

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "text-blue-600",
  INSTAGRAM: "text-pink-600",
  GOOGLE_BUSINESS: "text-green-600",
};

const SENTIMENT_STYLES: Record<string, string> = {
  POSITIVE: "text-emerald-600",
  NEUTRAL: "text-muted-foreground",
  NEGATIVE: "text-red-500",
};

const SENTIMENT_DOTS: Record<string, string> = {
  POSITIVE: "bg-emerald-500",
  NEUTRAL: "bg-zinc-400",
  NEGATIVE: "bg-red-500",
};

export function InboxClient({ items }: InboxClientProps) {
  const [filter, setFilter] = useState<"all" | "unread" | "resolved">("all");
  const [platform, setPlatform] = useState<string>("all");
  const [selected, setSelected] = useState<InboxItemData | null>(null);
  const [reply, setReply] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [sending, setSending] = useState(false);
  const [localItems, setLocalItems] = useState(items);

  const filtered = localItems.filter((item) => {
    if (filter === "unread" && item.isRead) return false;
    if (filter === "resolved" && !item.isResolved) return false;
    if (filter === "all" && item.isResolved) return false;
    if (platform !== "all" && item.provider !== platform) return false;
    return true;
  });

  async function generateAiReply(item: InboxItemData) {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: item.message,
          platform: item.provider,
          businessName: item.business.name,
        }),
      });
      const data = await res.json();
      if (data.reply) setReply(data.reply);
    } finally {
      setLoadingAi(false);
    }
  }

  async function sendReply(item: InboxItemData) {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/inbox/${item.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      });
      setLocalItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, isResolved: true, isRead: true } : i)
      );
      setReply("");
      setSelected(null);
    } finally {
      setSending(false);
    }
  }

  async function markResolved(item: InboxItemData) {
    await fetch(`/api/inbox/${item.id}/resolve`, { method: "POST" });
    setLocalItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, isResolved: true } : i)
    );
    if (selected?.id === item.id) setSelected(null);
  }

  const unreadCount = localItems.filter((i) => !i.isRead && !i.isResolved).length;

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Item list */}
      <div className="w-80 shrink-0 flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* Filters */}
        <div className="p-3 border-b space-y-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="w-full h-8">
              <TabsTrigger value="all" className="flex-1 text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1 text-xs">
                Unread {unreadCount > 0 && <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1">{unreadCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1 text-xs">Done</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-1">
            {["all", "FACEBOOK", "INSTAGRAM", "GOOGLE_BUSINESS"].map((p) => {
              const Icon = p !== "all" ? PLATFORM_ICONS[p] : Filter;
              return (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={cn(
                    "flex-1 flex items-center justify-center h-7 rounded-md text-xs transition-colors",
                    platform === p
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No items found
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((item) => {
                const Icon = PLATFORM_ICONS[item.provider] ?? MapPin;
                const color = PLATFORM_COLORS[item.provider] ?? "";
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelected(item);
                      setReply(item.aiSuggestedReply ?? "");
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors",
                      selected?.id === item.id && "bg-muted/50",
                      !item.isRead && "border-l-2 border-l-primary"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {item.authorName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-medium truncate">{item.authorName}</span>
                          <Icon className={cn("h-3 w-3 shrink-0", color)} />
                          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", SENTIMENT_DOTS[item.sentiment])} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{item.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] text-muted-foreground/60">{item.business.name}</span>
                          <span className="text-[11px] text-muted-foreground/60">{formatRelativeTime(item.receivedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detail pane */}
      <div className="flex-1 rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Select a message to view</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{selected.authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{selected.authorName}</span>
                    <Badge variant="outline" className={cn("text-xs", SENTIMENT_STYLES[selected.sentiment])}>
                      {selected.sentiment.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    via {selected.provider.toLowerCase().replace("_", " ")} · {selected.business.name}
                  </div>
                </div>
              </div>
              {!selected.isResolved && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => markResolved(selected)}
                >
                  <CheckCircle className="h-3 w-3" />
                  Resolve
                </Button>
              )}
            </div>

            {/* Message */}
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="bg-muted/30 rounded-xl p-4 text-sm">
                {selected.message}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(selected.receivedAt).toLocaleString()}
              </p>
            </div>

            {/* Reply area */}
            {!selected.isResolved && (
              <div className="p-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Reply</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1.5"
                    onClick={() => generateAiReply(selected)}
                    disabled={loadingAi}
                  >
                    {loadingAi
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Wand2 className="h-3 w-3" />
                    }
                    AI Reply
                  </Button>
                </div>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write your reply..."
                  className="min-h-[90px] text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    disabled={!reply.trim() || sending}
                    onClick={() => sendReply(selected)}
                  >
                    {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                    Send Reply
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={cn("text-sm font-medium leading-none", className)}>{children}</label>;
}
