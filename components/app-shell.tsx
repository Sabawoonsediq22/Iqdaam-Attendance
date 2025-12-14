"use client";

import React from "react";
import ClientProviders from "@/components/client-providers";
import { ThemeProvider } from "@/hooks/use-theme";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
    <h1 className="text-2xl font-semibold" data-testid="page-title">
      {getPageTitle()}
    </h1>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  session?: Session;
}

export default function AppShell({ children, session }: AppShellProps) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <ClientProviders>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style}>
            <div className="flex h-screen w-full overflow-x-hidden">
              <AppSidebar session={session} />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-4 min-w-0">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <PageTitle />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <UserMenu session={session} />
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-4 sm:p-6">
                  <div className="w-full max-w-none">{children}</div>
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster richColors/>
        </TooltipProvider>
      </ThemeProvider>
    </ClientProviders>
  );
}
