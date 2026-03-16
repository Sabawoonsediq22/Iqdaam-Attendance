import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const classes = await storage.getAllClasses();
    const attendance = await storage.getAllAttendance();
    const today = new Date().toISOString().split("T")[0];

    const todayAttendance = attendance.filter((a) => a.date === today);
    const presentToday = todayAttendance.filter(
      (a) => a.status === "present",
    ).length;
    const absentToday = todayAttendance.filter(
      (a) => a.status === "absent",
    ).length;
    const lateToday = todayAttendance.filter((a) => a.status === "late").length;

    // Get all classes (no status filtering needed)
    const allClassIds = new Set(classes.map((cls) => cls.id));

    // Get all student-class relationships
    const allStudentClasses = await storage.getAllStudentClasses();

    // Find all students in all classes
    const studentsInClassesSet = new Set<string>();
    for (const sc of allStudentClasses) {
      if (allClassIds.has(sc.classId)) {
        studentsInClassesSet.add(sc.studentId);
      }
    }

    const totalStudents = studentsInClassesSet.size;
    const todayAttendanceRate =
      totalStudents > 0
        ? (((presentToday + lateToday) / totalStudents) * 100).toFixed(1)
        : "0.0";

    const weekAgo = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .split("T")[0];
    const weekAttendance = attendance.filter((a) => a.date >= weekAgo);
    const weekPresent = weekAttendance.filter(
      (a) => a.status === "present" || a.status === "late",
    ).length;
    const weekTotal = weekAttendance.length;
    const weekAttendanceRate =
      weekTotal > 0 ? ((weekPresent / weekTotal) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      totalStudents,
      todayAttendanceRate,
      weekAttendanceRate,
      absentToday,
      presentToday,
      lateToday,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
