"use client";

import { useState, useRef } from "react";
import { Facebook, Instagram, MapPin, Wand2, Hash, Loader2, Upload, X, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SocialAccount {
  id: string;
  provider: string;
  name: string | null;
  isConnected: boolean;
}

interface Business {
  id: string;
  name: string;
  brandTone: string;
  socialAccounts: SocialAccount[];
}

interface ComposerClientProps {
  businesses: Business[];
  workspaceId: string;
}

const POST_TYPES = [
  { value: "SINGLE_IMAGE", label: "Single Image" },
  { value: "CAROUSEL", label: "Carousel" },
  { value: "REEL", label: "Reel" },
  { value: "VIDEO", label: "Video" },
  { value: "TEXT", label: "Text Only" },
  { value: "GOOGLE_UPDATE", label: "Google Update" },
];

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

export function ComposerClient({ businesses, workspaceId }: ComposerClientProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    businesses[0] ?? null
  );
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [cta, setCta] = useState("");
  const [postType, setPostType] = useState("SINGLE_IMAGE");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [aiLoading, setAiLoading] = useState<"caption" | "hashtags" | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<"draft" | "scheduled" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function togglePlatform(accountId: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  }

  async function generateCaption() {
    if (!selectedBusiness) return;
    setAiLoading("caption");
    try {
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: selectedBusiness.name,
          tone: selectedBusiness.brandTone,
          postType,
        }),
      });
      const data = await res.json();
      if (data.caption) setCaption(data.caption);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(null);
    }
  }

  async function generateHashtags() {
    if (!caption) return;
    setAiLoading("hashtags");
    try {
      const res = await fetch("/api/ai/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, postType }),
      });
      const data = await res.json();
      if (data.hashtags) setHashtags(data.hashtags.join(" "));
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(null);
    }
  }

  async function handleSave(status: "DRAFT" | "SCHEDULED") {
    if (!selectedBusiness || !caption) return;
    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          businessId: selectedBusiness.id,
          caption,
          hashtags: hashtags.split(/\s+/).filter(Boolean),
          cta,
          postType,
          status,
          scheduledAt: status === "SCHEDULED" ? scheduledAt : undefined,
          targetAccountIds: selectedPlatforms,
        }),
      });
      if (res.ok) {
        setSavedStatus(status === "DRAFT" ? "draft" : "scheduled");
        setTimeout(() => setSavedStatus(null), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  const charCount = caption.length;
  const charLimit = 2200;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main composer */}
      <div className="lg:col-span-2 space-y-4">
        {/* Business selector */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm shrink-0">Business</Label>
              <Select
                value={selectedBusiness?.id ?? ""}
                onValueChange={(id) => {
                  setSelectedBusiness(businesses.find((b) => b.id === id) ?? null);
                  setSelectedPlatforms([]);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label className="text-sm shrink-0">Type</Label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Caption */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Caption</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={generateCaption}
                  disabled={!selectedBusiness || aiLoading !== null}
                >
                  {aiLoading === "caption"
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Wand2 className="h-3 w-3" />
                  }
                  AI Caption
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={generateHashtags}
                  disabled={!caption || aiLoading !== null}
                >
                  {aiLoading === "hashtags"
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Hash className="h-3 w-3" />
                  }
                  AI Hashtags
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="relative">
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption here, or let AI draft it for you..."
                className="min-h-[140px] resize-none pr-16"
                maxLength={charLimit}
              />
              <span className={cn(
                "absolute bottom-3 right-3 text-xs tabular-nums",
                charCount > charLimit * 0.9 ? "text-amber-500" : "text-muted-foreground"
              )}>
                {charCount}/{charLimit}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hashtags</Label>
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#coffee #localcafe #morning"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Call to Action</Label>
              <Input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Visit us today! Link in bio."
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Media</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*,video/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setMediaFiles((prev) => [...prev, ...files]);
              }}
            />
            {mediaFiles.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {mediaFiles.map((file, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-muted border">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setMediaFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors"
            >
              <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop files here or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Images and videos up to 100MB</p>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar panel */}
      <div className="space-y-4">
        {/* Platform targets */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Publish to</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {selectedBusiness?.socialAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No accounts connected yet.{" "}
                <a href="/settings/integrations" className="text-primary hover:underline">
                  Connect accounts
                </a>
              </p>
            ) : (
              selectedBusiness?.socialAccounts.map((account) => {
                const Icon = PLATFORM_ICONS[account.provider] ?? MapPin;
                const color = PLATFORM_COLORS[account.provider] ?? "text-gray-500";
                const selected = selectedPlatforms.includes(account.id);
                return (
                  <button
                    key={account.id}
                    onClick={() => account.isConnected && togglePlatform(account.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border text-left transition-colors text-sm",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/30",
                      !account.isConnected && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", color)} />
                    <span className="flex-1 truncate">
                      {account.name ?? account.provider.toLowerCase().replace("_", " ")}
                    </span>
                    {!account.isConnected && (
                      <Badge variant="secondary" className="text-xs">Not connected</Badge>
                    )}
                    {selected && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <Tabs defaultValue="now">
              <TabsList className="w-full">
                <TabsTrigger value="now" className="flex-1 text-xs">Publish now</TabsTrigger>
                <TabsTrigger value="schedule" className="flex-1 text-xs">Schedule</TabsTrigger>
              </TabsList>
              <TabsContent value="now">
                <p className="text-xs text-muted-foreground mt-2">
                  Content will be published immediately after review.
                </p>
              </TabsContent>
              <TabsContent value="schedule" className="space-y-2 mt-0">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          {savedStatus && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-2.5 text-center">
              Saved as {savedStatus}!
            </div>
          )}
          <Button
            className="w-full"
            disabled={!caption || selectedPlatforms.length === 0 || saving}
            onClick={() => handleSave(scheduledAt ? "SCHEDULED" : "DRAFT")}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {scheduledAt ? "Schedule Post" : "Save as Draft"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={!caption || saving}
            onClick={() => handleSave("DRAFT")}
          >
            Save Draft
          </Button>
        </div>
      </div>
    </div>
  );
}
