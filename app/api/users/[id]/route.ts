import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth"; // <-- IMPORTANT for NextAuth v5
import { UTApi } from "uploadthing/server";
import { hash, compare } from "bcryptjs";
import { createNotification, notificationTemplates } from "@/lib/notifications";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get the currently logged-in user from NextAuth (v5)
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Prevent accessing other users' data
    if (userId !== id) {
      return NextResponse.json(
        { error: "Forbidden: You can only access your own data" },
        { status: 403 }
      );
    }

    // Get user data from database
    const userData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        isApproved: users.isApproved,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: userData[0],
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { avatar, name, currentPassword, newPassword, role } = await request.json();

    // Get the currently logged-in user from NextAuth (v5)
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const isAdmin = session.user.role === "admin";

    // Allow admins to update any user, others can only update themselves
    if (!isAdmin && userId !== id) {
      return NextResponse.json(
        { error: "Forbidden: You can only update your own profile" },
        { status: 403 }
      );
    }

    // Get current user data to check for old avatar
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    // Delete old avatar from UploadThing if it exists and is being replaced
    if (currentUser.length > 0 && currentUser[0].avatar && avatar && currentUser[0].avatar !== avatar) {
      try {
        const utapi = new UTApi();
        // Extract file key from UploadThing URL
        // URL format: https://utfs.io/f/{fileKey}
        const urlParts = currentUser[0].avatar.split('/');
        const fileKey = urlParts[urlParts.length - 1];

        if (fileKey) {
          await utapi.deleteFiles([fileKey]);
          console.log(`Deleted old avatar file: ${fileKey}`);
        }
      } catch (error) {
        console.error("Failed to delete old avatar from UploadThing:", error);
        // Continue with update even if old avatar deletion fails
      }
    }

    // Prepare update data
    const updateData: { avatar?: string; name?: string; password?: string; role?: string } = {};

    // Handle password change
    if (currentPassword && newPassword) {
      if (!currentUser[0].password) {
        return NextResponse.json(
          { error: "Current password not found" },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await compare(currentPassword, currentUser[0].password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Hash the new password
      const hashedNewPassword = await hash(newPassword, 12);
      updateData.password = hashedNewPassword;
    }

    if (avatar !== undefined) updateData.avatar = avatar;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined && isAdmin) updateData.role = role;

    // Update the user
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id));

    return NextResponse.json({
      message: "Profile updated successfully",
      ...updateData,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get the currently logged-in user from NextAuth (v5)
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Allow admins to delete any user, or users to delete themselves
    if (session.user.role !== "admin" && userId !== id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own account" },
        { status: 403 }
      );
    }

    // Check if the user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete avatar from UploadThing if it exists
    if (user[0].avatar) {
      try {
        const utapi = new UTApi();
        // Extract file key from UploadThing URL
        // URL format: https://utfs.io/f/{fileKey}
        const urlParts = user[0].avatar.split('/');
        const fileKey = urlParts[urlParts.length - 1];

        if (fileKey) {
          await utapi.deleteFiles([fileKey]);
          console.log(`Deleted avatar file: ${fileKey}`);
        }
      } catch (error) {
        console.error("Failed to delete avatar from UploadThing:", error);
        // Continue with user deletion even if avatar deletion fails
      }
    }

    // Delete the user
    await db.delete(users).where(eq(users.id, id));

    // Create notification for user deletion
    try {
      await createNotification({
        ...notificationTemplates.userDeleted(user[0].name, session.user.name),
      });
    } catch (error) {
      console.error("Failed to create notification for user deletion:", error);
    }

    // NextAuth v5 automatically removes the session when the user is deleted

    return NextResponse.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
