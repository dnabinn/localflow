"use client";

import { useState, useRef } from "react";
import { Upload, Search, Image as ImageIcon, Video, Film, Trash2, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, truncate } from "@/lib/utils";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
  tags: string[];
}

interface MediaLibraryClientProps {
  files: MediaFile[];
  workspaceId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.includes("gif")) return Film;
  return ImageIcon;
}

function getFileType(mimeType: string): "image" | "video" | "gif" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.includes("gif")) return "gif";
  return "image";
}

export function MediaLibraryClient({ files, workspaceId }: MediaLibraryClientProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video" | "gif">("all");
  const [uploading, setUploading] = useState(false);
  const [localFiles, setLocalFiles] = useState(files);
  const [selected, setSelected] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = localFiles.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && getFileType(f.mimeType) !== typeFilter) return false;
    return true;
  });

  async function handleUpload(uploadFiles: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(uploadFiles)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("workspaceId", workspaceId);
        const res = await fetch("/api/media/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setLocalFiles((prev) => [data.file, ...prev]);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-1">
          {(["all", "image", "video", "gif"] as const).map((t) => (
            <Button
              key={t}
              variant={typeFilter === t ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setTypeFilter(t)}
            >
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>

        <div className="flex gap-1 border rounded-lg p-0.5">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setView("grid")}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setView("list")}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          multiple
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{localFiles.length} files</span>
        {selected.length > 0 && (
          <>
            <span>·</span>
            <span>{selected.length} selected</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive gap-1">
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Upload dropzone (empty state) */}
      {filtered.length === 0 && !search && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-16 text-center hover:bg-muted/30 transition-colors"
        >
          <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">Drop files to upload</p>
          <p className="text-sm text-muted-foreground mt-1">
            Images, videos, and GIFs up to 100MB
          </p>
        </button>
      )}

      {/* Grid view */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {filtered.map((file) => {
            const FileIcon = getFileIcon(file.mimeType);
            const isSelected = selected.includes(file.id);
            const isVideo = file.mimeType.startsWith("video/");

            return (
              <div
                key={file.id}
                onClick={() => toggleSelect(file.id)}
                className={cn(
                  "group relative aspect-square rounded-lg overflow-hidden bg-muted border-2 cursor-pointer transition-all",
                  isSelected ? "border-primary" : "border-transparent hover:border-border"
                )}
              >
                {isVideo ? (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{file.name}</p>
                </div>
                {isVideo && (
                  <Badge className="absolute top-1 right-1 text-[10px] h-4 px-1">Video</Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="divide-y">
            {filtered.map((file) => {
              const FileIcon = getFileIcon(file.mimeType);
              const isSelected = selected.includes(file.id);

              return (
                <div
                  key={file.id}
                  onClick={() => toggleSelect(file.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors",
                    isSelected && "bg-primary/5"
                  )}
                >
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted border shrink-0">
                    {file.mimeType.startsWith("video/") ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                      {file.width && file.height && ` · ${file.width}×${file.height}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
