import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { students, studentClasses, classes } from "@/lib/schema";
import { insertStudentWithClassSchema } from "@/lib/schema";
import { createNotification, notificationTemplates } from "@/lib/notifications";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (classId) {
      // Get students enrolled in the specific class
      const enrolledStudents = await db
        .select({
          id: students.id,
          studentId: students.studentId,
          name: students.name,
          fatherName: students.fatherName,
          phone: students.phone,
          gender: students.gender,
          email: students.email,
          avatar: students.avatar,
          className: classes.name,
        })
        .from(students)
        .innerJoin(studentClasses, eq(students.id, studentClasses.studentId))
        .innerJoin(classes, eq(studentClasses.classId, classes.id))
        .where(eq(studentClasses.classId, classId));

      return NextResponse.json(enrolledStudents);
    } else {
      // Get all students
      const allStudents = await db.select().from(students);
      return NextResponse.json(allStudents);
    }
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = insertStudentWithClassSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }
    const { classId, ...studentData } = result.data;

    // Create the student
    const newStudent = await db
      .insert(students)
      .values(studentData)
      .returning();

    if (newStudent.length === 0) {
      return NextResponse.json(
        { error: "Failed to create student" },
        { status: 500 }
      );
    }

    // Enroll in class if classId provided
    if (classId) {
      await db.insert(studentClasses).values({
        studentId: newStudent[0].id,
        classId,
      });
    }

    // Get class name for notification
    let className = "Unknown Class";
    if (classId) {
      const cls = await db
        .select({ name: classes.name })
        .from(classes)
        .where(eq(classes.id, classId))
        .limit(1);
      if (cls.length > 0) {
        className = cls[0].name;
      }
    }

    // Create notification
    try {
      await createNotification({
        ...notificationTemplates.studentAdded(
          newStudent[0].name,
          className,
          session.user.name
        ),
        entityId: newStudent[0].id,
      });
    } catch (error) {
      console.error(
        "Failed to create notification for student creation:",
        error
      );
    }

    return NextResponse.json(newStudent[0], { status: 201 });
  } catch (error) {
    console.error("Create student error:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
