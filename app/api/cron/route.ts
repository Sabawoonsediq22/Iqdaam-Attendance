import { NextRequest, NextResponse } from "next/server";
import { cronManager } from "@/lib/cron-manager";

export async function GET() {
  try {
    const jobs = cronManager.getAllJobs();
    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        name: job.name,
        schedule: job.schedule,
        running: job.running,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        error: job.error,
      })),
    });
  } catch (error) {
    console.error("Error getting cron jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get cron jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "start":
        if (!jobId) {
          cronManager.startAllJobs();
          return NextResponse.json({
            success: true,
            message: "All cron jobs started",
          });
        } else {
          const success = cronManager.startJob(jobId);
          return NextResponse.json({
            success,
            message: success ? `Job ${jobId} started` : `Failed to start job ${jobId}`,
          });
        }

      case "stop":
        if (!jobId) {
          cronManager.stopAllJobs();
          return NextResponse.json({
            success: true,
            message: "All cron jobs stopped",
          });
        } else {
          const success = cronManager.stopJob(jobId);
          return NextResponse.json({
            success,
            message: success ? `Job ${jobId} stopped` : `Failed to stop job ${jobId}`,
          });
        }

      case "run":
        if (!jobId) {
          return NextResponse.json(
            { success: false, error: "jobId is required for run action" },
            { status: 400 }
          );
        }
        const success = await cronManager.runJobNow(jobId);
        return NextResponse.json({
          success,
          message: success ? `Job ${jobId} executed manually` : `Failed to execute job ${jobId}`,
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error managing cron jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to manage cron jobs" },
      { status: 500 }
    );
  }
}