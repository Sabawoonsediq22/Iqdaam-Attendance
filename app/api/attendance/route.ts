import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { insertAttendanceSchema } from "@/lib/schema";
import { createNotification, notificationTemplates } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const day = searchParams.get("day");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const studentId = searchParams.get("studentId");

    let attendance;
    if (classId && day && month && year) {
      attendance = await storage.getAttendanceByClassAndDateParts(classId, day, month, year);
    } else if (studentId) {
      attendance = await storage.getAttendanceByStudent(studentId);
    } else {
      attendance = await storage.getAllAttendance();
    }

    return NextResponse.json(attendance);
   } catch {
     return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
   }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = insertAttendanceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    const newAttendance = await storage.createAttendance(result.data);

    // Get class name for notification
    const studentClass = await storage.getClass(newAttendance.classId);
    const className = studentClass ? studentClass.name : "Unknown Class";
    const date = `${newAttendance.day}/${newAttendance.month}/${newAttendance.year}`;

    // Create notification
    try {
      await createNotification({
        ...notificationTemplates.attendanceTaken(className, date, session.user.name),
        entityId: newAttendance.id,
      });
    } catch (error) {
      console.error("Failed to create notification for attendance taken:", error);
    }

    return NextResponse.json(newAttendance, { status: 201 });
   } catch {
     return NextResponse.json({ error: "Failed to create attendance" }, { status: 500 });
   }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of attendance records" }, { status: 400 });
    }

    const validatedRecords = [];
    for (const record of body) {
      const result = insertAttendanceSchema.safeParse(record);
      if (!result.success) {
        return NextResponse.json({ error: `Invalid record: ${result.error.message}` }, { status: 400 });
      }
      validatedRecords.push(result.data);
    }

    const created = await storage.bulkUpsertAttendance(validatedRecords);

    // Get class name and date for notification
    const firstRecord = validatedRecords[0];
    const studentClass = await storage.getClass(firstRecord.classId);
    const className = studentClass ? studentClass.name : "Unknown Class";
    const date = `${firstRecord.day}/${firstRecord.month}/${firstRecord.year}`;

    // Create notification for bulk attendance update
    try {
      await createNotification({
        ...notificationTemplates.attendanceUpdated(className, date, session.user.name),
        entityId: created[0]?.id, // Assuming created has ids
      });
    } catch (error) {
      console.error("Failed to create notification for attendance update:", error);
    }

    return NextResponse.json(created, { status: 200 });
   } catch {
     return NextResponse.json({ error: "Failed to create attendance records" }, { status: 500 });
   }
}