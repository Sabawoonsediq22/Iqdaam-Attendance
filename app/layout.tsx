import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NetworkStatusMonitor from "@/components/NetworkStatusMonitor";
import ClientProviders from "@/components/client-providers";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student Attendance Tracker",
  description: "Track student attendance across classes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.className} antialiased`}>
        <ClientProviders>
          <NetworkStatusMonitor />
          {children}
        </ClientProviders>
        <Toaster richColors />
      </body>
    </html>
  );
}