import { NextResponse } from "next/server";
import { checkCompletedClasses } from "@/lib/class-completion";

// API route for Vercel Cron to check for completed classes
export async function GET() {
  try {
    console.log("Checking for completed classes via Vercel Cron...");
    await checkCompletedClasses();
    return NextResponse.json({
      success: true,
      message: "Class completion check completed successfully",
    });
  } catch (error) {
    console.error("Error checking completed classes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check completed classes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
