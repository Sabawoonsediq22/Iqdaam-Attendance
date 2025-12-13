import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, students } from "@/lib/schema";
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
    const { newClassData } = body;

    if (!newClassData) {
      return NextResponse.json(
        { error: "newClassData is required" },
        { status: 400 }
      );
    }

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

    // Create the new class
    const newClass = await db
      .insert(classes)
      .values({
        ...newClassData,
        status: "active", // New classes start as active
      })
      .returning();

    if (newClass.length === 0) {
      return NextResponse.json(
        { error: "Failed to create new class" },
        { status: 500 }
      );
    }

    // Move all students from current class to new class
    await db
      .update(students)
      .set({ classId: newClass[0].id })
      .where(eq(students.classId, id));

    // Create notification
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
      console.error("Failed to create notification for class upgrade:", error);
    }

    return NextResponse.json({
      message: `Created ${newClass[0].name} and moved students from ${currentClass[0].name}`,
      newClass: newClass[0],
    });
  } catch (error) {
    console.error("Upgrade class error:", error);
    return NextResponse.json(
      { error: "Failed to upgrade class" },
      { status: 500 }
    );
  }
}
