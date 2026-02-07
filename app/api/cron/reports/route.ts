import { NextRequest, NextResponse } from "next/server";
import { processScheduledReports } from "@/app/api/reports/schedule/route";

// Secure API route for Vercel Cron to process scheduled reports
export async function GET(request: NextRequest) {
  // Verify the request comes from Vercel Cron
  const authHeader = request.headers.get("authorization");
  const validToken = process.env.CRON_SECRET;

  if (!validToken || authHeader !== `Bearer ${validToken}`) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid or missing token" },
      { status: 401 }
    );
  }

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
      { status: 500 }
    );
  }
}
