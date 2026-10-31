"use client";

import React from "react";
import { PanelLeft, Menu as MenuIcon } from "lucide-react";
import ClientProviders from "@/components/client-providers";
import { ThemeProvider } from "@/hooks/use-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { NavProvider, useNav } from "@/components/nav-context";
import { UserMenu } from "@/components/user-menu";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";

function PageTitle() {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/classes":
        return "Classes";
      case "/attendance":
        return "Attendance";
      case "/students":
        return "Students";
      case "/reports":
        return "Reports";
      case "/notifications":
        return "Notifications";
      case "/settings":
        return "Settings";
      case "/users":
        return "Users";
      case "/fees":
        return "Fee Management";
      default:
        return "Dashboard";
    }
  };

  return (
    <h1
      className="truncate text-xl font-semibold tracking-tight"
      data-testid="page-title"
    >
      {getPageTitle()}
    </h1>
  );
}

function NavToggle() {
  const { isMobile, isCollapsed, mobileOpen, toggleMobile, toggleCollapsed } =
    useNav();

  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        data-testid="button-sidebar-toggle"
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
        onClick={toggleMobile}
      >
        <MenuIcon className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      data-testid="button-sidebar-toggle"
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!isCollapsed}
      onClick={toggleCollapsed}
    >
      <PanelLeft className="h-5 w-5" />
    </Button>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  session?: Session;
}

export default function AppShell({ children, session }: AppShellProps) {
  return (
    <ClientProviders>
      <ThemeProvider>
        <TooltipProvider>
          <NavProvider>
            <div className="flex h-screen w-full overflow-x-hidden">
              <AppSidebar session={session} />
              <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 sm:px-4">
                  <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                    <NavToggle />
                    <PageTitle />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <UserMenu session={session} />
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-4 sm:p-6">
                  {/* One content width for every page in the application */}
                  <div className="mx-auto w-full max-w-[1600px]">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </NavProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ClientProviders>
  );
}
