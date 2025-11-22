import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  image?: string;
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    redirect('/auth');
  }

  if (!(session.user as ExtendedUser)?.isApproved) {
    redirect('/pending-approval');
  }

  // For teachers, redirect to attendance if accessing other routes
  // But since this is layout, we can check pathname, but in server, pathname is not available directly.
  // We'll handle this in client for now, or use middleware.

  const sessionWithExpires = {
    ...session,
    expires: "2025-12-31T23:59:59.999Z", // Far future date
  };

  return <DashboardClient session={sessionWithExpires}>{children}</DashboardClient>;
}