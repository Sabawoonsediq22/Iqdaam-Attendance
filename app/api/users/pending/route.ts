import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get all unapproved users
    const pendingUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(sql`${users.isApproved} = false OR ${users.isApproved} = 'false'`);

    return NextResponse.json({ users: pendingUsers });
  } catch (error) {
    console.error("Get pending users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}