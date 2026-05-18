import Link from "next/link";
import { PenSquare, Star, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const actions = [
  {
    label: "New Post",
    description: "Create and schedule content",
    href: "/compose",
    icon: PenSquare,
    variant: "default" as const,
  },
  {
    label: "Reply to Reviews",
    description: "Respond to your inbox",
    href: "/inbox",
    icon: Star,
    variant: "outline" as const,
  },
  {
    label: "Upload Media",
    description: "Add to your media library",
    href: "/media",
    icon: Upload,
    variant: "outline" as const,
  },
];

export function QuickActions() {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.href}
              variant={action.variant}
              className="w-full justify-start gap-3 h-auto py-2.5 px-3"
              asChild
            >
              <Link href={action.href}>
                <Icon className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground font-normal">{action.description}</div>
                </div>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
