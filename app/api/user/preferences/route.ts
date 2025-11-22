import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user preferences
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    // If no preferences exist, return defaults
    if (preferences.length === 0) {
      return NextResponse.json({
        pushNotifications: true,
        emailUpdates: false,
      });
    }

    return NextResponse.json({
      pushNotifications: preferences[0].pushNotifications,
      emailUpdates: preferences[0].emailUpdates,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { pushNotifications, emailUpdates } = await request.json();

    // Validate input
    if (typeof pushNotifications !== "boolean" || typeof emailUpdates !== "boolean") {
      return NextResponse.json(
        { error: "Invalid preferences data" },
        { status: 400 }
      );
    }

    // Check if preferences already exist
    const existingPreferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (existingPreferences.length > 0) {
      // Update existing preferences
      await db
        .update(userPreferences)
        .set({
          pushNotifications,
          emailUpdates,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, session.user.id));
    } else {
      // Create new preferences
      await db.insert(userPreferences).values({
        userId: session.user.id,
        pushNotifications,
        emailUpdates,
      });
    }

    return NextResponse.json({
      message: "Preferences saved successfully",
      pushNotifications,
      emailUpdates,
    });
  } catch (error) {
    console.error("Save preferences error:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}