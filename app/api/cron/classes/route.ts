import { NextRequest, NextResponse } from "next/server";
import { checkCompletedClasses } from "@/lib/class-completion";

// Secure API route for Vercel Cron to check for completed classes
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const validToken = process.env.CRON_SECRET;

  if (!validToken || authHeader !== `Bearer ${validToken}`) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid or missing token" },
      { status: 401 }
    );
  }

  try {
    console.log("Checking for completed classes via Vercel Cron...");
    await checkCompletedClasses();
    return NextResponse.json({
      success: true,
      message: "Class completion check completed successfully",
    });
  } catch (error) {
    console.error("Error checking completed classes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check completed classes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
