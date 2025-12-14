import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentClasses } from "@/lib/schema";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db.select().from(studentClasses);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get student classes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student classes" },
      { status: 500 }
    );
  }
}
