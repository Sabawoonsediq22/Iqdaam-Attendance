import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { insertStudentSchema } from "@/lib/schema";
import { createNotification, notificationTemplates } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    const students = classId
      ? await storage.getStudentsByClass(classId)
      : await storage.getAllStudents();

    return NextResponse.json(students);
   } catch {
     return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
   }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = insertStudentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    const newStudent = await storage.createStudent(result.data);

    // Get class name for notification
    const studentClass = await storage.getClass(newStudent.classId);
    const className = studentClass ? studentClass.name : "Unknown Class";

    // Create notification
    try {
      await createNotification({
        ...notificationTemplates.studentAdded(newStudent.name, className, session.user.name),
        entityId: newStudent.id,
      });
    } catch (error) {
      console.error("Failed to create notification for student creation:", error);
    }

    return NextResponse.json(newStudent, { status: 201 });
   } catch {
     return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
   }
}