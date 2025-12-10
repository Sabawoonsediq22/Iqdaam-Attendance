"use client";

import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  BookOpen,
  Bell,
  UserCheck,
} from "lucide-react";

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  image?: string;
}
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { Session } from "next-auth";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & Analytics",
    roles: ["admin"],
  },
  {
    title: "Classes",
    url: "/classes",
    icon: BookOpen,
    description: "Manage Class Schedule",
    roles: ["admin"],
  },
  {
    title: "Students",
    url: "/students",
    icon: Users,
    description: "Student Management",
    roles: ["admin"],
  },
  {
    title: "Take Attendance",
    url: "/attendance",
    icon: CheckSquare,
    description: "Mark Attendance",
    roles: ["admin", "teacher"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
    description: "View Analytics",
    roles: ["admin"],
  },
  {
    title: "Users",
    url: "/users",
    icon: UserCheck,
    description: "User Management",
    roles: ["admin"],
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    description: "System Alerts",
    roles: ["admin"],
  },
];

// Animation variants
const hoverVariants = {
  hover: {
    scale: 1.02,
    x: 4,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

interface AppSidebarProps {
  session?: Session;
}

export function AppSidebar({ session: propSession }: AppSidebarProps) {
  const location = usePathname();
  const { setOpenMobile, isMobile, state } = useSidebar();
  const { data: session } = useSession();
  const effectiveSession = propSession || session;

  // Get unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/notifications/unread"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread");
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get pending users count
  const { data: pendingUsersCount = 0 } = useQuery({
    queryKey: ["/api/users/pending"],
    queryFn: async () => {
      const res = await fetch("/api/users/pending");
      if (!res.ok) return 0;
      const data = await res.json();
      return data.users?.length || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleNavigation = () => {
    // Close mobile sidebar after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r-0 bg-linear-to-b from-background via-background/95 to-background/90 backdrop-blur supports-backdrop-filter:bg-background/60">
      <SidebarContent className="px-3 py-6 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {/* Enhanced Header */}
        <div className="mb-2 px-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 border border-primary/20">
              <Image
                src="/logo.svg"
                alt="StudentTracker Logo"
                width={40}
                height={40}
              />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h2 className="text-lg font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  StudentTracker
                </h2>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Smart Attendance Management
            </p>
          )}
        </div>

        {/* Scrollable Navigation Content */}
        <div className="flex-1">
          <SidebarGroup className="space-y-2">
            {!isCollapsed && (
              <div>
                <SidebarGroupLabel className="text-lg font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Navigation
                </SidebarGroupLabel>
              </div>
            )}

            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <div>
                  {menuItems
                    .filter(
                      (item) =>
                        effectiveSession?.user &&
                        (effectiveSession.user as ExtendedUser).role &&
                        item.roles.includes(
                          (effectiveSession.user as ExtendedUser).role
                        )
                    )
                    .map((item) => {
                      const isActive = location === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <motion.div
                            variants={hoverVariants}
                            whileHover="hover"
                            className="relative"
                          >
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "group relative w-full h-12 px-3 rounded-xl transition-all duration-200",
                                "hover:bg-linear-to-r hover:from-primary/10 hover:to-primary/5",
                                "hover:shadow-lg hover:shadow-primary/10",
                                "border border-transparent hover:border-primary/20 mb-1",
                                isActive && [
                                  "bg-linear-to-r from-primary/15 to-primary/10",
                                  "border-primary/30 shadow-lg shadow-primary/20",
                                  "text-primary font-medium",
                                ]
                              )}
                              data-testid={`nav-${item.title
                                .toLowerCase()
                                .replace(" ", "-")}`}
                            >
                              <Link
                                href={item.url}
                                onClick={handleNavigation}
                                className="flex items-center gap-3 w-full relative z-10"
                              >
                                {/* Icon with enhanced styling */}
                                <motion.div
                                  className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                                    isActive
                                      ? "bg-primary/20 text-primary shadow-sm"
                                      : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                  )}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <item.icon className="h-4 w-4" />
                                </motion.div>

                                {/* Text content */}
                                {!isCollapsed && (
                                  <div className="flex-1 min-w-0 overflow-hidden">
                                    <div className="flex flex-col">
                                      <span className="text-[1rem] font-medium truncate">
                                        {item.title}
                                      </span>
                                      {!isCollapsed && (
                                        <span className="text-xs text-muted-foreground truncate">
                                          {item.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Notification badge */}
                                {item.title === "Notifications" &&
                                  unreadCount > 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="h-5 min-w-5 text-xs px-1.5 flex items-center justify-center font-bold shadow-sm animate-pulse"
                                    >
                                      {unreadCount > 99 ? "99+" : unreadCount}
                                    </Badge>
                                  )}

                                {/* Pending users badge */}
                                {item.title === "Users" &&
                                  pendingUsersCount > 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="h-5 min-w-5 text-xs px-1.5 flex items-center justify-center font-bold shadow-sm animate-pulse"
                                    >
                                      {pendingUsersCount > 99
                                        ? "99+"
                                        : pendingUsersCount}
                                    </Badge>
                                  )}

                                {/* Active indicator */}
                                {isActive && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </motion.div>
                        </SidebarMenuItem>
                      );
                    })}
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
