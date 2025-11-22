import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetCodes } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    // Validate input
    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, verification code, and new password are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Verification code must be 6 digits" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Verify the code is still valid
    const resetCode = await db
      .select()
      .from(passwordResetCodes)
      .where(
        and(
          eq(passwordResetCodes.email, email),
          eq(passwordResetCodes.code, code),
          eq(passwordResetCodes.isUsed, true), // Code should be marked as used from verification
          gt(passwordResetCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (resetCode.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 12);

    // Update user password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, existingUser[0].id));

    // Delete the used reset code
    await db
      .delete(passwordResetCodes)
      .where(eq(passwordResetCodes.id, resetCode[0].id));

    return NextResponse.json({
      message: "Password reset successfully",
      success: true,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}