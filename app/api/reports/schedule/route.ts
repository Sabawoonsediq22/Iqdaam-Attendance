import { NextRequest, NextResponse } from "next/server";
import { sendReportEmail } from "@/lib/email";
import { createNotification, notificationTemplates } from "@/lib/notifications";
import { auth } from "@/lib/auth";

// This is a basic implementation for scheduling reports
// In a real application, you would integrate with a job scheduler like Bull or Agenda
// and an email service like SendGrid, Mailgun, etc.

interface ScheduledReport {
  id: string;
  type: "weekly" | "monthly";
  email: string;
  classId?: string;
  studentId?: string;
  createdAt: Date;
  nextRun: Date;
  isActive: boolean;
}

// In-memory storage for demo purposes
const scheduledReports: ScheduledReport[] = [];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, email, classId, studentId } = body;

    if (!type || !email) {
      return NextResponse.json(
        { error: "Type and email are required" },
        { status: 400 }
      );
    }

    if (!["weekly", "monthly"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'weekly' or 'monthly'" },
        { status: 400 }
      );
    }

    const now = new Date();
    const nextRun = new Date(now);

    if (type === "weekly") {
      // Schedule for next Sunday
      const daysUntilSunday = (7 - now.getDay()) % 7;
      nextRun.setDate(
        now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday)
      );
      nextRun.setHours(9, 0, 0, 0); // 9 AM
    } else {
      // Schedule for first day of next month
      nextRun.setMonth(now.getMonth() + 1, 1);
      nextRun.setHours(9, 0, 0, 0); // 9 AM
    }

    const scheduledReport: ScheduledReport = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      email,
      classId,
      studentId,
      createdAt: now,
      nextRun,
      isActive: true,
    };

    scheduledReports.push(scheduledReport);

    // Create notification for scheduled report creation
    await createNotification(
      notificationTemplates.scheduledReportCreated(
        email,
        type,
        (session.user as { name?: string }).name || "Admin"
      )
    );

    return NextResponse.json({
      message: "Report scheduled successfully",
      scheduledReport,
    });
  } catch (error) {
    console.error("Error scheduling report:", error);
    return NextResponse.json(
      { error: "Failed to schedule report" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    scheduledReports,
  });
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    const reportIndex = scheduledReports.findIndex(
      (report) => report.id === id
    );
    if (reportIndex === -1) {
      return NextResponse.json(
        { error: "Scheduled report not found" },
        { status: 404 }
      );
    }

    const report = scheduledReports[reportIndex];

    // Create notification before removing
    await createNotification(
      notificationTemplates.scheduledReportRemoved(
        report.email,
        report.type,
        (session.user as { name?: string }).name || "Admin"
      )
    );

    scheduledReports.splice(reportIndex, 1);

    return NextResponse.json({
      message: "Scheduled report removed successfully",
    });
  } catch (error) {
    console.error("Error removing scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to remove scheduled report" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const { action } = body; // 'stop' or 'resume'

    if (!id) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    if (!["stop", "resume"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'stop' or 'resume'" },
        { status: 400 }
      );
    }

    const report = scheduledReports.find((report) => report.id === id);
    if (!report) {
      return NextResponse.json(
        { error: "Scheduled report not found" },
        { status: 404 }
      );
    }

    const wasActive = report.isActive;
    report.isActive = action === "resume";

    // Create notification for the action
    if (action === "stop" && wasActive) {
      await createNotification(
        notificationTemplates.scheduledReportStopped(
          report.email,
          report.type,
          (session.user as { name?: string }).name || "Admin"
        )
      );
    } else if (action === "resume" && !wasActive) {
      await createNotification(
        notificationTemplates.scheduledReportResumed(
          report.email,
          report.type,
          (session.user as { name?: string }).name || "Admin"
        )
      );
    }

    return NextResponse.json({
      message: `Scheduled report ${action}d successfully`,
      scheduledReport: report,
    });
  } catch (error) {
    console.error("Error updating scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to update scheduled report" },
      { status: 500 }
    );
  }
}

// This would be called by a cron job or scheduler in a real application
export async function processScheduledReports() {
  const now = new Date();
  const dueReports = scheduledReports.filter(
    (report) => report.nextRun <= now && report.isActive
  );

  for (const report of dueReports) {
    try {
      // Generate report data
      const params = new URLSearchParams({
        type: report.type,
        ...(report.classId && { classId: report.classId }),
        ...(report.studentId && { studentId: report.studentId }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/reports?${params}`
      );
      const reportData = await response.json();

      // Send the report email
      const emailResult = await sendReportEmail({
        email: report.email,
        reportType: report.type,
        reportData,
        startDate: reportData.startDate,
        endDate: reportData.endDate,
      });

      if (emailResult.success) {
        console.log(
          `Successfully sent ${report.type} report to ${report.email}`
        );
      } else {
        console.error(
          `Failed to send ${report.type} report to ${report.email}:`,
          emailResult.error
        );

        // Create notification for failed report
        await createNotification(
          notificationTemplates.scheduledReportFailed(
            report.email,
            report.type,
            emailResult.error || "Unknown error"
          )
        );
      }

      // Update next run date
      const nextRun = new Date(report.nextRun);
      if (report.type === "weekly") {
        nextRun.setDate(nextRun.getDate() + 7);
      } else {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      report.nextRun = nextRun;
    } catch (error) {
      console.error(`Failed to process scheduled report ${report.id}:`, error);
    }
  }
}
