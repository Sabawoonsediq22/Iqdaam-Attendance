import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";

export async function GET() {
   try {
     const session = await auth();

     if (!session?.user?.id) {
       return NextResponse.json(
         { error: "Unauthorized" },
         { status: 401 }
       );
     }

     const userNotifications = await storage.getNotificationsForUser(session.user.id);
     const count = userNotifications.filter(notification => !notification.isRead).length;
     return NextResponse.json({ count });
   } catch {
     return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
   }
}