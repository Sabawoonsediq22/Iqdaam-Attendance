import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetCodes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check if user exists (but don't reveal this information)
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success message to prevent email enumeration
    if (existingUser.length === 0) {
      return NextResponse.json({
        message: "If an account with this email exists, we've sent a password reset code.",
      });
    }

    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing unused codes for this email
    await db
      .delete(passwordResetCodes)
      .where(eq(passwordResetCodes.email, email));

    // Insert new reset code
    await db.insert(passwordResetCodes).values({
      email,
      code,
      expiresAt,
      isUsed: false,
    });

    // Send email
    const emailResult = await sendPasswordResetEmail({ email, code });

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      // Still return success to prevent enumeration, but log the error
      return NextResponse.json({
        message: "If an account with this email exists, we've sent a password reset code.",
      });
    }

    return NextResponse.json({
      message: "If an account with this email exists, we've sent a password reset code.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}