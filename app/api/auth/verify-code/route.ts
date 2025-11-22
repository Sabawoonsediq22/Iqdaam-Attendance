import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passwordResetCodes } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
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

    // Find valid reset code
    const resetCode = await db
      .select()
      .from(passwordResetCodes)
      .where(
        and(
          eq(passwordResetCodes.email, email),
          eq(passwordResetCodes.code, code),
          eq(passwordResetCodes.isUsed, false),
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

    // Mark code as used
    await db
      .update(passwordResetCodes)
      .set({ isUsed: true })
      .where(eq(passwordResetCodes.id, resetCode[0].id));

    return NextResponse.json({
      message: "Code verified successfully",
      valid: true,
    });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}