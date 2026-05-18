"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, MapPin, Facebook, Instagram, Zap, Plus, ExternalLink, ChevronRight, CheckCircle2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "CALM", label: "Calm" },
  { value: "LUXURY", label: "Luxury" },
  { value: "TRADITIONAL", label: "Traditional" },
  { value: "MODERN", label: "Modern" },
  { value: "FRIENDLY", label: "Friendly" },
  { value: "PROFESSIONAL", label: "Professional" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
];

const PLATFORMS = [
  {
    provider: "FACEBOOK",
    name: "Facebook Pages",
    description: "Connect your Facebook business page to publish posts and manage comments.",
    icon: Facebook,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    connectPath: "/api/auth/facebook/connect",
  },
  {
    provider: "INSTAGRAM",
    name: "Instagram Business",
    description: "Connects automatically when you link a Facebook Page that has an Instagram Business account.",
    icon: Instagram,
    color: "text-pink-600",
    bg: "bg-pink-50 dark:bg-pink-950/40",
    connectPath: null, // via Facebook
  },
  {
    provider: "GOOGLE_BUSINESS",
    name: "Google Business Profile",
    description: "Manage your Google reviews and post updates directly from LocalFlow.",
    icon: MapPin,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/40",
    connectPath: "/api/auth/google/connect",
  },
];

interface SettingsClientProps {
  workspace: { id: string; name: string; slug: string };
  businesses: {
    id: string;
    name: string;
    brandTone: string;
    timezone: string;
    preferredLanguage: string;
    socialAccounts: { id: string; provider: string; isConnected: boolean; name: string | null }[];
    locations: { id: string; name: string; address: string | null }[];
  }[];
  userEmail: string;
  defaultTab?: string;
}

export function SettingsClient({ workspace, businesses, userEmail, defaultTab = "workspace" }: SettingsClientProps) {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  async function disconnect(accountId: string) {
    setDisconnecting(accountId);
    try {
      await fetch(`/api/social-accounts/${accountId}/disconnect`, { method: "POST" });
      router.refresh();
    } finally {
      setDisconnecting(null);
    }
  }

  async function saveWorkspace() {
    setSaving(true);
    try {
      await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      });
      setSavedMsg("Saved!");
      setTimeout(() => setSavedMsg(""), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="workspace">Workspace</TabsTrigger>
        <TabsTrigger value="businesses">Businesses</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="ai">AI</TabsTrigger>
      </TabsList>

      {/* Workspace tab */}
      <TabsContent value="workspace" className="space-y-4">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Workspace Settings</CardTitle>
            <CardDescription>Manage your workspace name and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Workspace Slug</Label>
              <Input value={workspace.slug} disabled className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Account Email</Label>
              <Input value={userEmail} disabled className="text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveWorkspace} disabled={saving} size="sm">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {savedMsg && <span className="text-sm text-emerald-600">{savedMsg}</span>}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Businesses tab */}
      <TabsContent value="businesses" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Businesses</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add and configure your business locations.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" asChild>
            <a href="/settings/businesses/new">
              <Plus className="h-3.5 w-3.5" />
              Add Business
            </a>
          </Button>
        </div>

        {businesses.length === 0 ? (
          <Card className="border-border/60 border-dashed">
            <CardContent className="py-12 text-center">
              <Building2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium">No businesses yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your first business to start managing content.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {businesses.map((biz) => (
              <Card key={biz.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{biz.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {biz.locations.length} location{biz.locations.length !== 1 ? "s" : ""} ·
                          {" "}{biz.socialAccounts.filter((a) => a.isConnected).length} connected accounts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {biz.brandTone.toLowerCase()}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* AI Preferences for this business */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Brand Tone</Label>
                      <Select defaultValue={biz.brandTone}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Language</Label>
                      <Select defaultValue={biz.preferredLanguage}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.value} value={l.value} className="text-xs">
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Timezone</Label>
                      <Input
                        defaultValue={biz.timezone}
                        className="h-8 text-xs"
                        placeholder="America/New_York"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Integrations tab */}
      <TabsContent value="integrations" className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Platform Integrations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect your social accounts and review platforms.
          </p>
        </div>

        <div className="space-y-3">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            return (
              <Card key={platform.provider} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-2.5 rounded-lg shrink-0", platform.bg)}>
                      <Icon className={cn("h-5 w-5", platform.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium">{platform.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>

                      {businesses.length === 0 ? (
                        <p className="text-xs text-muted-foreground mt-3 italic">
                          Add a business first to connect accounts.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {businesses.map((biz) => {
                            const account = biz.socialAccounts.find(
                              (a) => a.provider === platform.provider
                            );
                            const isDisconnecting = disconnecting === account?.id;
                            return (
                              <div key={biz.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                                <span className="text-xs font-medium">{biz.name}</span>
                                {account?.isConnected ? (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-xs text-emerald-600">{account.name}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs text-muted-foreground"
                                      disabled={isDisconnecting}
                                      onClick={() => disconnect(account.id)}
                                    >
                                      {isDisconnecting ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : "Disconnect"}
                                    </Button>
                                  </div>
                                ) : platform.connectPath ? (
                                  <Button
                                    size="sm"
                                    className="h-6 text-xs gap-1"
                                    variant="outline"
                                    asChild
                                  >
                                    <a href={`${platform.connectPath}?businessId=${biz.id}`}>
                                      <ExternalLink className="h-3 w-3" />
                                      Connect
                                    </a>
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Via Facebook</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* TikTok placeholder */}
          <Card className="border-border/60 opacity-60">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">TikTok</h4>
                    <Badge variant="outline" className="text-xs">Planned</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    TikTok integration is planned for a future release.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* AI tab */}
      <TabsContent value="ai" className="space-y-4">
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                <Zap className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base">AI Assistant</CardTitle>
                <CardDescription>Configure AI caption and reply generation.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 p-4 space-y-3">
              <h4 className="text-sm font-medium">Capabilities</h4>
              {[
                { label: "Caption generation", description: "AI drafts captions based on your brand tone" },
                { label: "Hashtag suggestions", description: "Relevant hashtags generated from your content" },
                { label: "Review replies", description: "AI-crafted replies to Google and social reviews" },
                { label: "Multilingual support", description: "Replies generated in your preferred language" },
              ].map((cap) => (
                <div key={cap.label} className="flex items-start gap-3">
                  <div className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mt-0.5">
                    <svg className="h-2.5 w-2.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cap.label}</p>
                    <p className="text-xs text-muted-foreground">{cap.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">OpenAI Model</Label>
              <Select defaultValue="gpt-4o-mini">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recommended)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                GPT-4o Mini offers the best balance of speed and quality for most use cases.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

