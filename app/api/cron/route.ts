import { NextResponse } from "next/server";

// This endpoint provides information about the available cron jobs
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Vercel Cron jobs are configured in vercel.json",
    jobs: [
      {
        id: "report-scheduler",
        name: "Scheduled Reports Processor",
        path: "/api/cron/reports",
        schedule: "0 9 * * *",
        description:
          "Checks and sends scheduled reports daily at 9 AM UTC (1:30 PM local time)",
      },
      {
        id: "daily-cleanup",
        name: "Daily Cleanup",
        path: "/api/cron/cleanup",
        schedule: "0 2 * * *",
        description: "Cleans up old notifications at 2 AM daily",
      },
      {
        id: "class-completion-checker",
        name: "Class Completion Checker",
        path: "/api/cron/classes",
        schedule: "0 0 * * *",
        description: "Checks for completed classes daily at midnight",
      },
    ],
  });
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
