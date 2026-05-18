import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, MapPin, Plus } from "lucide-react";

const platforms = [
  { name: "Facebook Pages", icon: Facebook, color: "text-blue-600" },
  { name: "Instagram Business", icon: Instagram, color: "text-pink-600" },
  { name: "Google Business", icon: MapPin, color: "text-green-600" },
];

interface ConnectedPlatformsProps {
  count: number;
}

export function ConnectedPlatforms({ count }: ConnectedPlatformsProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Platforms</CardTitle>
          <span className="text-xs text-muted-foreground">{count} connected</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {platforms.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.name}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
            >
              <Icon className={`h-4 w-4 ${p.color}`} />
              <span className="text-sm flex-1">{p.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                <Link href="/settings/integrations">
                  <Plus className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
