"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Session } from "next-auth";
import AppShell from "@/components/app-shell";
import { SessionProvider } from "next-auth/react";

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  image?: string;
}

interface DashboardClientProps {
  session: Session & { expires: string };
  children: React.ReactNode;
}

export default function DashboardClient({ session, children }: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect teachers to attendance page if they're trying to access other dashboard routes
    if ((session.user as ExtendedUser)?.role === "teacher" && !pathname.startsWith('/attendance') && pathname !== '/settings') {
      router.push('/attendance');
    }
  }, [session, pathname, router]);

  return (
    <SessionProvider session={session}>
      <AppShell session={session}>{children}</AppShell>
    </SessionProvider>
  );
}