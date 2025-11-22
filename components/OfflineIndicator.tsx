"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  className?: string;
  showAsBanner?: boolean;
}

export default function OfflineIndicator({
  className,
  showAsBanner = true
}: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Set initial state - eslint-disable-next-line react-hooks/exhaustive-deps
      setIsOffline(!navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Don't render anything on server side
  if (typeof window === 'undefined' || !isOffline) return null;

  if (showAsBanner) {
    return (
      <Card className={cn("border-amber-200 bg-amber-50/80 backdrop-blur-sm", className)}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100">
            <WifiOff className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-800">No Internet Connection</p>
            <p className="text-sm text-amber-700">
              You&apos;re currently offline. Some features may not work properly.
            </p>
          </div>
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        </CardContent>
      </Card>
    );
  }

  // Compact version for overlays or smaller spaces
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md", className)}>
      <WifiOff className="w-4 h-4 text-red-600" />
      <span className="text-sm font-medium text-red-800">Offline</span>
    </div>
  );
}