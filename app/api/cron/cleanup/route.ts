import { NextResponse } from "next/server";
import { cleanupOldNotifications } from "@/lib/cleanup";

// API route for Vercel Cron to cleanup old notifications
export async function GET() {
  try {
    console.log("Running daily notification cleanup via Vercel Cron...");
    await cleanupOldNotifications();
    return NextResponse.json({
      success: true,
      message: "Notification cleanup completed successfully",
    });
  } catch (error) {
    console.error("Error during notification cleanup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cleanup notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
