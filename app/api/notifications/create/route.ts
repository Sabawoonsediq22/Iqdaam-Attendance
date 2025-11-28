import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, userIds } = await request.json();

    // Create notification
    await createNotification(data, userIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}