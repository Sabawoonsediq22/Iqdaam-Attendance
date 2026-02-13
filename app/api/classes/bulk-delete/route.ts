import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes } from "@/lib/schema";
import { inArray } from "drizzle-orm";
import { createNotification, notificationTemplates } from "@/lib/notifications";

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No class IDs provided for deletion" },
        { status: 400 }
      );
    }

    // Fetch classes to be deleted for notification purposes
    const classesToDelete = await db
      .select()
      .from(classes)
      .where(inArray(classes.id, ids));

    if (classesToDelete.length === 0) {
      return NextResponse.json(
        { error: "No classes found with the provided IDs" },
        { status: 404 }
      );
    }

    // Delete the classes
    await db.delete(classes).where(inArray(classes.id, ids));

    // Create notifications for each deleted class
    try {
      for (const cls of classesToDelete) {
        await createNotification({
          ...notificationTemplates.classDeleted(
            cls.name,
            session.user.name
          ),
          entityId: cls.id,
        });
      }
    } catch (error) {
      console.error("Failed to create notifications for bulk deletion:", error);
    }

    return NextResponse.json({
      message: `Successfully deleted ${classesToDelete.length} class${classesToDelete.length > 1 ? "es" : ""}`,
    });
  } catch (error) {
    console.error("Bulk delete classes error:", error);
    return NextResponse.json(
      { error: "Failed to delete classes" },
      { status: 500 }
    );
  }
}
