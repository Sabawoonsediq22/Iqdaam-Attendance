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

    // Check if user exists and get their approval status
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        isApproved: users.isApproved,
        name: users.name,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      // User doesn't exist - return generic message to prevent enumeration
      return NextResponse.json({
        exists: false,
        approved: false,
        message: "Invalid email or password",
      });
    }

    return NextResponse.json({
      exists: true,
      approved: user[0].isApproved,
      name: user[0].name,
      message: user[0].isApproved
        ? null
        : "Your account is pending approval. Please contact an administrator.",
    });
  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}