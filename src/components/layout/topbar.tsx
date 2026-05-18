"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/actions/auth";

interface TopbarProps {
  userEmail: string;
  userAvatarUrl?: string;
  pageTitle?: string;
}

export function Topbar({ userEmail, userAvatarUrl, pageTitle }: TopbarProps) {
  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b flex items-center px-6 gap-4 bg-background shrink-0">
      {pageTitle && (
        <h1 className="text-sm font-semibold mr-auto hidden sm:block">{pageTitle}</h1>
      )}

      {/* Search */}
      <div className="relative flex-1 max-w-xs ml-auto sm:ml-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-8 h-8 bg-muted/40 border-0 text-sm"
        />
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative h-8 w-8">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
            <Avatar className="h-8 w-8">
              {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userEmail} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">My Account</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings">Settings</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={logout}>
              <button type="submit" className="w-full text-left text-destructive">
                Sign out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
