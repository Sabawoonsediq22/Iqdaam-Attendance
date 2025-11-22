import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { eq, gte, lte, SQL } from "drizzle-orm";
import { attendance } from "@/lib/schema";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "daily";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = parseISO(startDateParam);
      endDate = parseISO(endDateParam);
    } else {
      const now = new Date();
      switch (type) {
        case "daily":
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case "weekly":
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case "monthly":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        default:
          startDate = startOfDay(now);
          endDate = endOfDay(now);
      }
    }

    // Build filter conditions
    const conditions: SQL[] = [
      gte(attendance.date, startDate.toISOString().split('T')[0]),
      lte(attendance.date, endDate.toISOString().split('T')[0])
    ];

    if (classId) {
      conditions.push(eq(attendance.classId, classId));
    }

    if (studentId) {
      conditions.push(eq(attendance.studentId, studentId));
    }

    // Get filtered attendance
    const filteredAttendance = await storage.getFilteredAttendance(conditions);

    // Get all students and classes for reference
    const allStudents = await storage.getAllStudents();
    const allClasses = await storage.getAllClasses();

    // Calculate summaries
    const totalRecords = filteredAttendance.length;
    const presentCount = filteredAttendance.filter(a => a.status === "present").length;
    const absentCount = filteredAttendance.filter(a => a.status === "absent").length;
    const lateCount = filteredAttendance.filter(a => a.status === "late").length;
    const attendanceRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords * 100).toFixed(1) : "0.0";

    // Group by date for trends
    const attendanceByDate = filteredAttendance.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[date][record.status as keyof typeof acc[typeof date]]++;
      acc[date].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; late: number; total: number }>);

    // Group by class
    const attendanceByClass = filteredAttendance.reduce((acc, record) => {
      const className = allClasses.find(c => c.id === record.classId)?.name || "Unknown";
      if (!acc[className]) {
        acc[className] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[className][record.status as keyof typeof acc[typeof className]]++;
      acc[className].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; late: number; total: number }>);

    // Group by student
    const attendanceByStudent = filteredAttendance.reduce((acc, record) => {
      const studentName = allStudents.find(s => s.id === record.studentId)?.name || "Unknown";
      if (!acc[studentName]) {
        acc[studentName] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[studentName][record.status as keyof typeof acc[typeof studentName]]++;
      acc[studentName].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; late: number; total: number }>);

    const reportData = {
      type,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      summary: {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        attendanceRate: parseFloat(attendanceRate)
      },
      attendance: filteredAttendance.map(record => ({
        ...record,
        student: allStudents.find(s => s.id === record.studentId),
        class: allClasses.find(c => c.id === record.classId)
      })),
      charts: {
        byDate: Object.entries(attendanceByDate).map(([date, data]) => ({ date, ...data })),
        byClass: Object.entries(attendanceByClass).map(([className, data]) => ({ class: className, ...data })),
        byStudent: Object.entries(attendanceByStudent).map(([studentName, data]) => ({ student: studentName, ...data }))
      }
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}