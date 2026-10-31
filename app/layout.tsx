import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import NetworkStatusMonitor from "@/components/NetworkStatusMonitor";
import ClientProviders from "@/components/client-providers";
import { Toaster } from "sonner";
import DeveloperJobModal from "@/components/DeveloperJobModal";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Iqdaam Educational Center",
  description: "Track student attendance across classes",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
          <DeveloperJobModal />
        </ClientProviders>
        {/* Single toast host for the whole application (rich colours, closable,
            14px text to match the app typography scale) */}
        <Toaster
          richColors
          closeButton
          toastOptions={{ style: { fontSize: "0.875rem" } }}
        />
      </body>
    </html>
  );
}
