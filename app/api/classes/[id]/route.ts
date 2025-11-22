import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createNotification, notificationTemplates } from "@/lib/notifications";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;

  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cls = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    if (cls.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // For now, allow access to all authenticated users
    // TODO: Implement class assignment system for teachers
    return NextResponse.json(cls[0]);
  } catch (error) {
    console.error("Get class error:", error);
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;

  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    const existingClass = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    if (existingClass.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const updated = await db
      .update(classes)
      .set(body)
      .where(eq(classes.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Update class error:", error);
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;

  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const existingClass = await db
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);

    if (existingClass.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    await db.delete(classes).where(eq(classes.id, id));

    // Create notification
    try {
      await createNotification({
        ...notificationTemplates.classDeleted(existingClass[0].name, session.user.name),
        entityId: id,
      });
    } catch (error) {
      console.error("Failed to create notification for class deletion:", error);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Delete class error:", error);
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
  }
}
