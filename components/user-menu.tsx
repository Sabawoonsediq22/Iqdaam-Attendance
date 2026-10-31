"use client";

import { useSession, signOut } from "next-auth/react";
import { useUser } from "@/components/client-providers";
import type { Session } from "next-auth";

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  image?: string;
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, LogOut, Crown, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";

interface UserMenuProps {
  session?: Session;
}

export function UserMenu({ session: propSession }: UserMenuProps) {
  const { data: session } = useSession();
  const effectiveSession = propSession || session;
  const { avatar } = useUser(); // Only use avatar from useUser, rest from session
  const { theme, setTheme } = useTheme();
  const [changeIcon, setChangeIcon] = useState(true);
  const router = useRouter();

  const handleThemeToggle = () => {
    setChangeIcon(!changeIcon);
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!effectiveSession?.user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full transition-colors hover:bg-accent/50"
        >
          <Avatar className="h-10 w-10 rounded-full ring-2 ring-background">
            <AvatarImage
              src={avatar || (effectiveSession.user as ExtendedUser).image || undefined}
              alt={effectiveSession.user.name || ""}
              className="rounded-full"
            />
            <AvatarFallback className="rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(effectiveSession.user.name || "U")}
            </AvatarFallback>
          </Avatar>
          {(effectiveSession.user as ExtendedUser).role === "admin" && (
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-warning ring-2 ring-background">
              <Crown className="h-2.5 w-2.5 text-warning-foreground" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-0" align="end" forceMount>
        <div className="border-b bg-primary/5 p-4">
          <DropdownMenuLabel className="p-0">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 rounded-full ring-2 ring-primary/20">
                <AvatarImage
                  src={avatar || (effectiveSession.user as ExtendedUser).image || undefined}
                  alt={effectiveSession.user.name || ""}
                  className="rounded-full"
                />
                <AvatarFallback className="rounded-full bg-primary/10 font-semibold text-primary">
                  {getInitials(effectiveSession.user.name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 min-w-0 flex-1">
                <p className="text-sm font-semibold leading-none truncate">{effectiveSession.user.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {effectiveSession.user.email}
                </p>
                <div className="flex items-center space-x-1">
                  <span className="text-xs leading-none text-muted-foreground capitalize">
                    {(effectiveSession.user as ExtendedUser).role}
                  </span>
                  {(effectiveSession.user as ExtendedUser).role === "admin" && (
                    <Crown className="h-3 w-3 text-warning" />
                  )}
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
        </div>

        <div className="p-2">
          <DropdownMenuItem
            onClick={handleThemeToggle}
            className="cursor-pointer rounded-lg hover:bg-accent/50 transition-colors duration-200 h-10 px-3"
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/50">
                {changeIcon ? (
                  <Sun className="h-4 w-4 text-warning" />
                ) : (
                  <Moon className="h-4 w-4 text-primary" />
                )}
              </div>
              <span className="font-medium">Toggle theme</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem
            onClick={handleSettings}
            className="cursor-pointer rounded-lg hover:bg-accent/50 transition-colors duration-200 h-10 px-3"
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/50">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium">Settings</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors duration-200 h-10 px-3 text-destructive focus:text-destructive"
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="font-medium">Sign out</span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}