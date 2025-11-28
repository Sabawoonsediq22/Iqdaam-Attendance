import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";

export async function PATCH() {
   try {
     const session = await auth();

     if (!session?.user?.id) {
       return NextResponse.json(
         { error: "Unauthorized" },
         { status: 401 }
       );
     }

     // Get all unread notifications for the current user and mark them as read
     const userNotifications = await storage.getNotificationsForUser(session.user.id);
     const unreadNotificationIds = userNotifications
       .filter(notification => !notification.isRead)
       .map(notification => notification.id);

     let success = true;
     for (const id of unreadNotificationIds) {
       const result = await storage.markNotificationAsRead(id);
       if (!result) {
         success = false;
         break;
       }
     }

     if (!success) {
       return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 });
     }
     return NextResponse.json({ success: true });
   } catch {
     return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 });
   }
}