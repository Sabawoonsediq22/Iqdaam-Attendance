import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { createNotification } from "@/lib/notifications";
import { UTApi } from "uploadthing/server";
import { db } from "@/lib/db";
import { students } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const student = await storage.getStudent(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(student);
   } catch {
     return NextResponse.json(
       { error: "Failed to fetch student" },
       { status: 500 }
     );
   }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const existingStudent = await storage.getStudent(id);
    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    const updated = await storage.updateStudent(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Create notification for student update
    try {
      await createNotification({
        title: "Student Updated",
        message: `**${session.user.name}** updated ${existingStudent.name}.`,
        type: "info",
        entityType: "student",
        entityId: id,
        actorName: session.user.name,
        action: "updated",
      });
    } catch (error) {
      console.error("Failed to create notification for student update:", error);
    }

    return NextResponse.json(updated);
   } catch {
     return NextResponse.json(
       { error: "Failed to update student" },
       { status: 500 }
     );
   }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;

  try {
    // Get the currently logged-in user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the student from the database
    const student = await db.select().from(students).where(eq(students.id, id)).limit(1);
    if (student.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const studentData = student[0];

    // If the student has an avatarUrl, delete the avatar from UploadThing
    if (studentData.avatar) {
      try {
        const utapi = new UTApi();
        // Extract file key from UploadThing URL
        const urlParts = studentData.avatar.split('/');
        const fileKey = urlParts[urlParts.length - 1];
        if (fileKey) {
          await utapi.deleteFiles([fileKey]);
        }
      } catch (error) {
        console.error("Failed to delete avatar from UploadThing:", error);
        // Continue with deletion even if avatar deletion fails
      }
    }

    // Delete the student record from the database
    await db.delete(students).where(eq(students.id, id));

    // Return a proper success response
    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Failed to delete student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}

