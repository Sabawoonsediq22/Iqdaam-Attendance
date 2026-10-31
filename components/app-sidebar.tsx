"use client";

import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  BookOpen,
  Bell,
  UserCheck,
  DollarSign,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { useNav } from "@/components/nav-context";

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  image?: string;
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    title: "Classes",
    url: "/classes",
    icon: BookOpen,
    roles: ["admin"],
  },
  {
    title: "Students",
    url: "/students",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Fees",
    url: "/fees",
    icon: DollarSign,
    roles: ["admin"],
  },
  {
    title: "Take Attendance",
    url: "/attendance",
    icon: CheckSquare,
    roles: ["admin", "teacher"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
    roles: ["admin"],
  },
  {
    title: "Users",
    url: "/users",
    icon: UserCheck,
    roles: ["admin"],
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    roles: ["admin"],
  },
];

interface AppSidebarProps {
  session?: Session;
}

export function AppSidebar({ session: propSession }: AppSidebarProps) {
  const location = usePathname();
  const { isMobile, isCollapsed, mobileOpen, closeMobile, toggleCollapsed } =
    useNav();
  const { data: session } = useSession();
  const effectiveSession = propSession || session;

  // Unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["/api/notifications/unread"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread");
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    },
    refetchInterval: 30000,
  });

  // Pending users count
  const { data: pendingUsersCount = 0 } = useQuery({
    queryKey: ["/api/users/pending"],
    queryFn: async () => {
      const res = await fetch("/api/users/pending");
      if (!res.ok) return 0;
      const data = await res.json();
      return data.users?.length || 0;
    },
    refetchInterval: 30000,
  });

  // Move focus into the drawer when it opens.
  const drawerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (isMobile && mobileOpen) drawerRef.current?.focus();
  }, [isMobile, mobileOpen]);

  const visibleItems = menuItems.filter(
    (item) =>
      effectiveSession?.user &&
      (effectiveSession.user as ExtendedUser).role &&
      item.roles.includes((effectiveSession.user as ExtendedUser).role)
  );

  const getBadge = (title: string) => {
    if (title === "Notifications") {
      return unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : null;
    }
    if (title === "Users") {
      return pendingUsersCount > 0
        ? pendingUsersCount > 99
          ? "99+"
          : pendingUsersCount
        : null;
    }
    return null;
  };

  // Mobile: drawer + scrim
  if (isMobile) {
    return (
      <>
        {/* Scrim */}
        <div
          aria-hidden={!mobileOpen}
          onClick={closeMobile}
          className={cn(
            "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden",
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        />

        {/* Drawer */}
        <aside
          id="mobile-navigation"
          ref={drawerRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md outline-none transition-transform duration-200 ease-out md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{
            visibility: mobileOpen ? "visible" : "hidden",
            transition: mobileOpen
              ? "transform 200ms ease-out"
              : "transform 200ms ease-out, visibility 0s linear 200ms",
          }}
        >
          {/* Drawer header */}
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            <Brand />
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close navigation"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Main">
            <MenuList
              items={visibleItems}
              location={location}
              touch
              getBadge={getBadge}
              onClickItem={closeMobile}
            />
          </nav>
        </aside>
      </>
    );
  }

  // Desktop: collapsible rail
  return (
    <aside
      data-state={isCollapsed ? "collapsed" : "expanded"}
      className={cn(
        "relative hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out md:flex",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 px-3",
          isCollapsed && "flex-col justify-center gap-0"
        )}
      >
        <Brand collapsed={isCollapsed} />
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3"
        aria-label="Main"
      >
        {!isCollapsed && (
          <span className="block px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Menu
          </span>
        )}
        <MenuList
          items={visibleItems}
          location={location}
          collapsed={isCollapsed}
          getBadge={getBadge}
        />
      </nav>

      {/* Clickable rail to collapse/expand */}
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="group/rail absolute inset-y-0 right-0 z-20 hidden w-3 cursor-col-resize outline-none sm:block"
      >
        <span className="absolute inset-y-0 right-0 w-px bg-primary/60 opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100" />
      </button>
    </aside>
  );
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Iqdaam — go to dashboard"
      className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <Image
        src="/iqdaam.jpg"
        alt="Iqdaam Logo"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-lg object-cover"
      />
      {!collapsed && (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold leading-tight">
            Iqdaam
          </span>
          <span className="truncate text-xs leading-tight text-muted-foreground">
            Attendance Portal
          </span>
        </span>
      )}
    </Link>
  );
}

interface MenuListProps {
  items: (typeof menuItems)[number][];
  location: string;
  collapsed?: boolean;
  touch?: boolean;
  getBadge: (title: string) => string | number | null;
  onClickItem?: () => void;
}

function MenuList({
  items,
  location,
  collapsed = false,
  touch = false,
  getBadge,
  onClickItem,
}: MenuListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.title}>
          <NavLinkItem
            item={item}
            isActive={location === item.url}
            collapsed={collapsed}
            touch={touch}
            badge={getBadge(item.title)}
            onClick={onClickItem}
          />
        </li>
      ))}
    </ul>
  );
}

interface NavLinkItemProps {
  item: (typeof menuItems)[number];
  isActive: boolean;
  collapsed?: boolean;
  touch?: boolean;
  badge: string | number | null;
  onClick?: () => void;
}

function NavLinkItem({
  item,
  isActive,
  collapsed = false,
  touch = false,
  badge,
  onClick,
}: NavLinkItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.url}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive ? true : undefined}
      data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
      className={cn(
        "group/item relative flex items-center gap-2.5 rounded-lg text-sm font-normal outline-none transition-colors duration-150",
        touch ? "h-11 px-3" : "h-10 px-2.5",
        collapsed && "mx-auto h-10 w-10 justify-center px-0",
        "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive &&
          "bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />

      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}

      {/* Count badge (expanded) / dot (collapsed) */}
      {badge !== null && !collapsed && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
          {badge}
        </span>
      )}
      {badge !== null && collapsed && (
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive"
        />
      )}

      {/* Collapsed-mode tooltip (desktop only) */}
      {collapsed && !touch && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover/item:opacity-100 group-focus-within/item:opacity-100"
        >
          {item.title}
        </span>
      )}
    </Link>
  );
}
