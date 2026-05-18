"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Facebook, Instagram, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FbPage {
  id: string;
  name: string;
  instagram_business_account?: { id: string; name: string; username: string };
}

interface FacebookPagePickerProps {
  pages: FbPage[];
}

export function FacebookPagePicker({ pages }: FacebookPagePickerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(
    pages.length === 1 ? pages[0].id : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/facebook/select-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: selected }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/settings?tab=integrations&connected=facebook");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {pages.map((page) => (
        <button
          key={page.id}
          type="button"
          onClick={() => setSelected(page.id)}
          className={cn(
            "w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors",
            selected === page.id
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-border hover:bg-muted/30"
          )}
        >
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
            <Facebook className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{page.name}</p>
            {page.instagram_business_account ? (
              <div className="flex items-center gap-1.5 mt-1">
                <Instagram className="h-3 w-3 text-pink-500" />
                <span className="text-xs text-muted-foreground">
                  @{page.instagram_business_account.username} will also connect
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">No Instagram Business account linked</p>
            )}
          </div>
          {selected === page.id && (
            <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          )}
        </button>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={connect} disabled={!selected || loading} className="w-full mt-2">
        {loading ? "Connecting…" : "Connect Page"}
      </Button>
    </div>
  );
}
