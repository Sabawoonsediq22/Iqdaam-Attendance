import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        isApproved: users.isApproved,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = user[0];

    return NextResponse.json({
      isApproved: userData.isApproved,
      role: userData.role,
    });
  } catch (error) {
    console.error("Check status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}