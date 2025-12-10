import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { insertNotificationSchema } from "@/lib/schema";

export async function GET() {
   try {
     const session = await auth();

     if (!session?.user?.id) {
       return NextResponse.json(
         { error: "Unauthorized" },
         { status: 401 }
       );
     }

     // Get notifications for the current user
     const userNotifications = await storage.getNotificationsForUser(session.user.id);
     return NextResponse.json(userNotifications);
   } catch {
     return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
   }
}

export async function POST(request: NextRequest) {
   try {
     const body = await request.json();
     const result = insertNotificationSchema.safeParse(body);
     if (!result.success) {
       return NextResponse.json({ error: result.error.message }, { status: 400 });
     }
     const notification = await storage.createNotification(result.data);
     return NextResponse.json(notification, { status: 201 });
   } catch {
     return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
   }
 }