"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function NetworkStatusMonitor() {

  useEffect(() => {
    const handleOnline = () => {
      toast.success("Back Online", {
        description: "Your connection has been restored.",
      });
    };

    const handleOffline = () => {
      toast.error("No Internet Connection", {
        description: "You are currently offline. Some features may not work.",
      });
    };

    // Check initial status
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}