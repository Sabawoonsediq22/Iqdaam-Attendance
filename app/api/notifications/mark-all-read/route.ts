import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function PATCH() {
   try {
     const success = await storage.markAllNotificationsAsRead();
     if (!success) {
       return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 });
     }
     return NextResponse.json({ success: true });
   } catch {
     return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 });
   }
 }