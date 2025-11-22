import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.isRead !== undefined) {
      const success = await storage.markNotificationAsRead(id);
      if (!success) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
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
    const { id } = await params;
    const success = await storage.deleteNotification(id);
    if (!success) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
   } catch {
     return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
   }
}