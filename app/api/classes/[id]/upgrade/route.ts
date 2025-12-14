import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, studentClasses, fees } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createNotification, notificationTemplates } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  const { id } = await params;

  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { newClassData, createOnly, promoteToClassId } = body;

    // Check if current class exists and is completed
    const currentClass = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    if (currentClass.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (currentClass[0].status !== "completed") {
      return NextResponse.json(
        { error: "Class must be completed to upgrade" },
        { status: 400 }
      );
    }

    if (newClassData) {
      // Create new class
      const newClass = await db
        .insert(classes)
        .values({
          ...newClassData,
          status: "active",
        })
        .returning();

      if (newClass.length === 0) {
        return NextResponse.json(
          { error: "Failed to create new class" },
          { status: 500 }
        );
      }

      if (!createOnly) {
        // Get students enrolled in the original class
        const enrolledStudents = await db
          .select({ studentId: studentClasses.studentId })
          .from(studentClasses)
          .where(eq(studentClasses.classId, id));

        // Enroll them in the new class
        if (enrolledStudents.length > 0) {
          const newEnrollments = enrolledStudents.map(({ studentId }) => ({
            studentId,
            classId: newClass[0].id,
          }));

          await db.insert(studentClasses).values(newEnrollments);

          // Create fee records for new enrollments
          const feeRecords = enrolledStudents.map(({ studentId }) => ({
            studentId,
            classId: newClass[0].id,
            feeToBePaid: newClass[0].fee,
          }));
          await db.insert(fees).values(feeRecords);
        }

        // Update the original class status to 'upgraded'
        await db
          .update(classes)
          .set({ status: "upgraded" })
          .where(eq(classes.id, id));

        try {
          await createNotification({
            ...notificationTemplates.classUpgraded(
              currentClass[0].name,
              newClass[0].name,
              session.user.name
            ),
            entityId: id,
          });
        } catch (error) {
          console.error(
            "Failed to create notification for class upgrade:",
            error
          );
        }

        return NextResponse.json({
          message: `Created ${newClass[0].name} and moved students from ${currentClass[0].name}`,
          newClass: newClass[0],
        });
      } else {
        return NextResponse.json({
          newClass: newClass[0],
        });
      }
    } else if (promoteToClassId) {
      // Check target class exists
      const targetClass = await db
        .select()
        .from(classes)
        .where(eq(classes.id, promoteToClassId))
        .limit(1);

      if (targetClass.length === 0) {
        return NextResponse.json(
          { error: "Target class not found" },
          { status: 404 }
        );
      }

      // Get students enrolled in the original class
      const enrolledStudents = await db
        .select({ studentId: studentClasses.studentId })
        .from(studentClasses)
        .where(eq(studentClasses.classId, id));

      // Enroll them in the target class
      if (enrolledStudents.length > 0) {
        const newEnrollments = enrolledStudents.map(({ studentId }) => ({
          studentId,
          classId: promoteToClassId,
        }));

        await db.insert(studentClasses).values(newEnrollments);

        // Create fee records for new enrollments
        const feeRecords = enrolledStudents.map(({ studentId }) => ({
          studentId,
          classId: promoteToClassId,
          feeToBePaid: targetClass[0].fee,
        }));
        await db.insert(fees).values(feeRecords);
      }

      // Update the original class status to 'upgraded'
      await db
        .update(classes)
        .set({ status: "upgraded" })
        .where(eq(classes.id, id));

      // Create notification
      try {
        await createNotification({
          ...notificationTemplates.classUpgraded(
            currentClass[0].name,
            targetClass[0].name,
            session.user.name
          ),
          entityId: id,
        });
      } catch (error) {
        console.error(
          "Failed to create notification for class upgrade:",
          error
        );
      }

      return NextResponse.json({
        message: `Students promoted to ${targetClass[0].name}`,
      });
    } else {
      return NextResponse.json(
        { error: "Either newClassData or promoteToClassId is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Upgrade class error:", error);
    return NextResponse.json(
      { error: "Failed to upgrade class" },
      { status: 500 }
    );
  }
}
