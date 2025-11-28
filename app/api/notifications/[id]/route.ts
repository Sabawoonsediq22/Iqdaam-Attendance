import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (body.isRead !== undefined) {
      // Check if the notification belongs to the current user
      const userNotifications = await storage.getNotificationsForUser(session.user.id);
      const notification = userNotifications.find(n => n.id === id);

      if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      const success = await storage.markNotificationAsRead(id);
      if (!success) {
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
   } catch {
     return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
   }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if the notification belongs to the current user
    const userNotifications = await storage.getNotificationsForUser(session.user.id);
    const notification = userNotifications.find(n => n.id === id);

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const success = await storage.deleteNotification(id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
   } catch {
     return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
   }
}