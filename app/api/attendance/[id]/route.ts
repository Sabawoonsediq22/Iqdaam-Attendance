import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { createNotification, notificationTemplates } from "@/lib/notifications";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const attendance = await storage.getAttendance(id);
    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(attendance);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || !session.user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const existingAttendance = await storage.getAttendance(id);
    if (!existingAttendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }
    const updated = await storage.updateAttendance(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Get class name for notification
    const studentClass = await storage.getClass(updated.classId);
    const className = studentClass ? studentClass.name : "Unknown Class";
    const date = `${updated.day}/${updated.month}/${updated.year}`;

    // Create notification for attendance update
    try {
      await createNotification({
        ...notificationTemplates.attendanceUpdated(className, date, session.user.name),
        entityId: id,
      });
    } catch (error) {
      console.error("Failed to create notification for attendance update:", error);
    }

    return NextResponse.json(updated);
  } catch{
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const session = await auth();
    if (!session || !session.user.isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingAttendance = await storage.getAttendance(id);
    if (!existingAttendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }
    const success = await storage.deleteAttendance(id);
    if (!success) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Get class name for notification
    const studentClass = await storage.getClass(existingAttendance.classId);
    const className = studentClass ? studentClass.name : "Unknown Class";
    const date = `${existingAttendance.day}/${existingAttendance.month}/${existingAttendance.year}`;

    // Create notification for attendance deletion
    try {
      await createNotification({
        title: "Attendance Deleted",
        message: `**${session.user.name}** deleted attendance record for class "${className}" on ${date}.`,
        type: "warning",
        entityType: "attendance",
        entityId: id,
        actorName: session.user.name,
        action: "deleted",
      });
    } catch (error) {
      console.error("Failed to create notification for attendance deletion:", error);
    }

    return NextResponse.json(null, { status: 204 });
  } catch{
    return NextResponse.json(
      { error: "Failed to delete attendance" },
      { status: 500 }
    );
  }
}
