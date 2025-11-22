import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const students = await storage.getAllStudents();
    const attendance = await storage.getAllAttendance();
    const today = new Date().toISOString().split('T')[0];

    const todayAttendance = attendance.filter(a => a.date === today);
    const presentToday = todayAttendance.filter(a => a.status === "present").length;
    const absentToday = todayAttendance.filter(a => a.status === "absent").length;
    const lateToday = todayAttendance.filter(a => a.status === "late").length;

    const totalStudents = students.length;
    const todayAttendanceRate = totalStudents > 0
      ? ((presentToday + lateToday) / totalStudents * 100).toFixed(1)
      : "0.0";

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const weekAttendance = attendance.filter(a => a.date >= weekAgo);
    const weekPresent = weekAttendance.filter(a => a.status === "present" || a.status === "late").length;
    const weekTotal = weekAttendance.length;
    const weekAttendanceRate = weekTotal > 0
      ? ((weekPresent / weekTotal) * 100).toFixed(1)
      : "0.0";

    return NextResponse.json({
      totalStudents,
      todayAttendanceRate,
      weekAttendanceRate,
      absentToday,
      presentToday,
      lateToday,
    });
   } catch {
     return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
   }
}