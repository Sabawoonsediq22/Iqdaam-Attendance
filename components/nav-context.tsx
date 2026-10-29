"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "iqdaam:sidebar-open";

interface NavContextValue {
  /** True below the md breakpoint. */
  isMobile: boolean;
  /** Desktop-only collapsed (icon) mode. */
  isCollapsed: boolean;
  /** Whether the mobile drawer is open. */
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const NavContext = React.createContext<NavContextValue | null>(null);

function useNav() {
  const context = React.useContext(NavContext);
  if (!context) throw new Error("useNav must be used within a NavProvider.");
  return context;
}

export function NavProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Restore the desktop collapsed/expanded preference.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setOpen(stored === "true");
    } catch {
      // Storage unavailable — keep the default.
    }
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore write failures.
      }
      return next;
    });
  }, []);

  const toggleMobile = React.useCallback(
    () => setMobileOpen((prev) => !prev),
    []
  );

  const closeMobile = React.useCallback(() => setMobileOpen(false), []);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close the drawer with Escape.
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // Lock body scroll while the mobile drawer is open.
  React.useEffect(() => {
    if (!(isMobile && mobileOpen)) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobile, mobileOpen]);

  const value = React.useMemo<NavContextValue>(
    () => ({
      isMobile,
      isCollapsed: open === false && !isMobile,
      mobileOpen,
      toggleCollapsed,
      toggleMobile,
      closeMobile,
    }),
    [isMobile, open, mobileOpen, toggleCollapsed, toggleMobile, closeMobile]
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export { useNav };
