"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AppShell from "@/components/app-shell";
import { Loader } from "@/components/loader";

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  image?: string;
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push('/auth');
      return;
    }

    if (!(session.user as ExtendedUser)?.isApproved) {
      router.push('/pending-approval');
      return;
    }

    // Redirect teachers to attendance page if they're trying to access other dashboard routes
    if ((session.user as ExtendedUser)?.role === "teacher" && !window.location.pathname.startsWith('/attendance')) {
      router.push('/attendance');
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <Loader variant="spinner" text="Loading..." />
      </div>
    )}

  if (!session || !(session.user as ExtendedUser)?.isApproved) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}