import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users, insertUserSchema } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { createNotification, notificationTemplates } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if there are no existing admins
    // This provides fallback if all admins are deleted
    const adminUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "admin"));

    const isNoAdmins = adminUsers[0].count === 0;
    const userRole = isNoAdmins ? "admin" : validatedData.role;
    const isApproved = isNoAdmins;

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        ...validatedData,
        role: userRole,
        isApproved,
        password: hashedPassword,
      })
      .returning();

    // Create notification for pending approval
    if (!isApproved) {
      try {
        // Get all admin user IDs
        const adminUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "admin"));

        const adminUserIds = adminUsers.map(user => user.id);

        await createNotification({
          ...notificationTemplates.userPendingApproval(newUser[0].name, newUser[0].email),
          entityId: newUser[0].id,
        }, adminUserIds);
      } catch (error) {
        console.error("Failed to create notification for pending user:", error);
        // Continue with registration even if notification fails
      }
    }

    return NextResponse.json(
      {
        message: isApproved
          ? "Account created successfully!"
          : "Account created successfully! Please wait for admin approval.",
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          role: newUser[0].role,
          isApproved: newUser[0].isApproved
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}