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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
    router.push("/");
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
          className="relative h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-200 border-2 border-transparent hover:border-primary/20"
        >
          <Avatar className="h-10 w-10 rounded-full ring-2 ring-background shadow-lg">
            <AvatarImage
              src={avatar || (effectiveSession.user as ExtendedUser).image || undefined}
              alt={effectiveSession.user.name || ""}
              className="rounded-full"
            />
            <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm rounded-full">
              {getInitials(effectiveSession.user.name || "U")}
            </AvatarFallback>
          </Avatar>
          {(effectiveSession.user as ExtendedUser).role === "admin" && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center ring-2 ring-background">
              <Crown className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 p-0 shadow-xl border-0 bg-background/95 backdrop-blur-xl"
        align="end"
        forceMount
      >
        <div className="p-4 bg-linear-to-br from-primary/5 via-primary/3 to-transparent border-b">
          <DropdownMenuLabel className="p-0">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 rounded-full ring-2 ring-primary/20">
                <AvatarImage
                  src={avatar || (effectiveSession.user as ExtendedUser).image || undefined}
                  alt={effectiveSession.user.name || ""}
                  className="rounded-full"
                />
                <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-primary font-bold rounded-full">
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
                    <Crown className="h-3 w-3 text-yellow-500" />
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
                  <Sun className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 text-blue-500" />
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
                <Settings className="h-4 w-4 text-gray-600" />
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