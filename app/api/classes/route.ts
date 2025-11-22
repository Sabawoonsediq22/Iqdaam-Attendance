import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, insertClassSchema } from "@/lib/schema";
import { createNotification, notificationTemplates } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, show all classes to authenticated users
    // TODO: Implement class assignment system for teachers
    const result = await db.select().from(classes);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Get classes error:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const result = insertClassSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    const newClass = await db
      .insert(classes)
      .values(result.data)
      .returning();

    // Create notification
    try {
      await createNotification({
        ...notificationTemplates.classAdded(newClass[0].name, session.user.name),
        entityId: newClass[0].id,
      });
    } catch (error) {
      console.error("Failed to create notification for class creation:", error);
    }

    return NextResponse.json(newClass[0], { status: 201 });
  } catch (error) {
    console.error("Create class error:", error);
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}