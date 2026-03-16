import { NextResponse } from "next/server";
import { renameClassesForNewMonth } from "@/lib/class-completion";

// API route for Vercel Cron to rename classes for the new month
// Runs daily but only performs renaming on the 1st of each month
export async function GET() {
  try {
    console.log("Cron job triggered: Checking for monthly class renaming...");
    await renameClassesForNewMonth();
    return NextResponse.json({
      success: true,
      message: "Monthly class renaming completed successfully",
    });
  } catch (error) {
    console.error("Error in monthly class renaming:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to rename classes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
