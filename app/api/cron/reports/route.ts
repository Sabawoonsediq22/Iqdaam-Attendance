import { NextResponse } from "next/server";
import { processScheduledReports } from "@/app/api/reports/schedule/route";

// API route for Vercel Cron to process scheduled reports
export async function GET() {
  try {
    console.log("Processing scheduled reports via Vercel Cron...");
    await processScheduledReports();
    return NextResponse.json({
      success: true,
      message: "Scheduled reports processed successfully",
    });
  } catch (error) {
    console.error("Error processing scheduled reports:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process scheduled reports",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
