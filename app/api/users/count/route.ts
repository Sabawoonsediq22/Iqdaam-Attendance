import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    return NextResponse.json({ count: result[0].count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    return NextResponse.json(
      { error: "Failed to fetch user count" },
      { status: 500 }
    );
  }
}