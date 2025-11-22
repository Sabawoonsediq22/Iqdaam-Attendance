import { NextRequest, NextResponse } from "next/server";

// This is a basic implementation for scheduling reports
// In a real application, you would integrate with a job scheduler like Bull or Agenda
// and an email service like SendGrid, Mailgun, etc.

interface ScheduledReport {
  id: string;
  type: 'weekly' | 'monthly';
  email: string;
  classId?: string;
  studentId?: string;
  createdAt: Date;
  nextRun: Date;
}

// In-memory storage for demo purposes
const scheduledReports: ScheduledReport[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, classId, studentId } = body;

    if (!type || !email) {
      return NextResponse.json(
        { error: "Type and email are required" },
        { status: 400 }
      );
    }

    if (!['weekly', 'monthly'].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'weekly' or 'monthly'" },
        { status: 400 }
      );
    }

    const now = new Date();
    const nextRun = new Date(now);

    if (type === 'weekly') {
      // Schedule for next Sunday
      const daysUntilSunday = (7 - now.getDay()) % 7;
      nextRun.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
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
    };

    scheduledReports.push(scheduledReport);

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

// This would be called by a cron job or scheduler in a real application
export async function processScheduledReports() {
  const now = new Date();
  const dueReports = scheduledReports.filter(report => report.nextRun <= now);

  for (const report of dueReports) {
    try {
      // Generate report data
      const params = new URLSearchParams({
        type: report.type,
        ...(report.classId && { classId: report.classId }),
        ...(report.studentId && { studentId: report.studentId }),
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reports?${params}`);
      const reportData = await response.json();

      // In a real application, you would send an email here
      console.log(`Sending ${report.type} report to ${report.email}`, reportData);

      // Update next run date
      const nextRun = new Date(report.nextRun);
      if (report.type === 'weekly') {
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