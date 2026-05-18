"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PenSquare, CalendarDays, Inbox,
  Image, Settings, Zap, ChevronDown, Building2, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Compose", href: "/compose", icon: PenSquare },
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
  { title: "Inbox", href: "/inbox", icon: Inbox, badge: 3 },
  { title: "Media", href: "/media", icon: Image },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  workspaceName: string;
  businesses: { id: string; name: string; logoUrl: string | null }[];
}

export function Sidebar({ workspaceName, businesses }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 shrink-0 border-r bg-background h-screen sticky top-0">
      {/* Logo + Workspace switcher */}
      <div className="p-4 border-b">
        <button className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-accent transition-colors text-left">
          <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{workspaceName}</div>
            <div className="text-xs text-muted-foreground">Workspace</div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {/* Main nav */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="h-5 text-xs px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Businesses section */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Businesses
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-0.5">
            {businesses.length === 0 ? (
              <Link href="/settings/businesses/new">
                <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Add your first business
                </span>
              </Link>
            ) : (
              businesses.map((biz) => (
                <Link key={biz.id} href={`/settings/businesses/${biz.id}`}>
                  <span className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{biz.name}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
