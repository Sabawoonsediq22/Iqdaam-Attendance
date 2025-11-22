import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get all users (approved and pending)
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isApproved: users.isApproved,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Get all users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}