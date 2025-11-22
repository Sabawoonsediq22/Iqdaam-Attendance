import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, notifications } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { createNotification, notificationTemplates } from "@/lib/notifications";
import { UTApi } from "uploadthing/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { userId, approved } = await request.json();

    if (!userId || typeof approved !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    if (approved) {
      // Approve the user
      const updatedUser = await db
        .update(users)
        .set({ isApproved: true })
        .where(eq(users.id, userId))
        .returning();

      if (updatedUser.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Mark the pending notification as read
      try {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(
            and(
              eq(notifications.entityType, "user"),
              eq(notifications.entityId, userId),
              eq(notifications.action, "pending")
            )
          );
      } catch (error) {
        console.error("Failed to mark pending notification as read:", error);
        // Continue with the approval process
      }

      // Create notification
      try {
        await createNotification({
          ...notificationTemplates.userApproved(updatedUser[0].name, session.user.name),
        });
      } catch (error) {
        console.error("Failed to create notification for user approval:", error);
      }

      return NextResponse.json({
        message: "User approved successfully",
        user: {
          id: updatedUser[0].id,
          email: updatedUser[0].email,
          name: updatedUser[0].name,
          role: updatedUser[0].role,
          isApproved: updatedUser[0].isApproved,
        }
      });
    } else {
      // Reject and delete the user
      const userToDelete = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userToDelete.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Delete avatar from UploadThing if it exists
      if (userToDelete[0].avatar) {
        try {
          const utapi = new UTApi();
          // Extract file key from UploadThing URL
          const urlParts = userToDelete[0].avatar.split('/');
          const fileKey = urlParts[urlParts.length - 1];

          if (fileKey) {
            await utapi.deleteFiles([fileKey]);
            console.log(`Deleted avatar file: ${fileKey}`);
          }
        } catch (error) {
          console.error("Failed to delete avatar from UploadThing:", error);
          // Continue with user deletion even if avatar deletion fails
        }
      }

      // Delete the user
      await db.delete(users).where(eq(users.id, userId));

      // Mark the pending notification as read
      try {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(
            and(
              eq(notifications.entityType, "user"),
              eq(notifications.entityId, userId),
              eq(notifications.action, "pending")
            )
          );
      } catch (error) {
        console.error("Failed to mark pending notification as read:", error);
        // Continue
      }

      // Create notification
      try {
        await createNotification({
          ...notificationTemplates.userRejected(userToDelete[0].name, session.user.name),
        });
      } catch (error) {
        console.error("Failed to create notification for user rejection:", error);
      }

      return NextResponse.json({
        message: "User rejected and deleted successfully",
      });
    }
  } catch (error) {
    console.error("User approval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}