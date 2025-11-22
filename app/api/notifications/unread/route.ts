import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
   try {
     const count = await storage.getUnreadNotificationsCount();
     return NextResponse.json({ count });
   } catch {
     return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
   }
 }