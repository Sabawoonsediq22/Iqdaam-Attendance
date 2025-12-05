import { storage } from "./storage";
import { db } from "./db";
import { userPreferences, users } from "./schema";
import { eq } from "drizzle-orm";
import { sendNotificationEmail } from "./email";

export interface NotificationData {
  title: string;
  message: string;
  type:
    | "success"
    | "error"
    | "warning"
    | "info"
    | "class"
    | "student"
    | "attendance";
  entityType?: "class" | "student" | "attendance" | "user";
  entityId?: string;
  actorName?: string;
  action?: string;
}

export const createNotification = async (
  data: NotificationData,
  userIds?: string[]
) => {
  try {
    // If no specific users provided, create notification for all users (legacy behavior)
    if (!userIds || userIds.length === 0) {
      // Get all user IDs
      const allUsers = await db.select({ id: users.id }).from(users);
      userIds = allUsers.map((user) => user.id);
    }

    // Create notification for each specified user, checking their preferences
    for (const userId of userIds) {
      // Get user preferences
      const preferences = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      // Get user email for sending emails
      const user = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) continue;

      // Default preferences: push notifications enabled, email updates disabled
      const pushNotificationsEnabled =
        preferences.length === 0 || preferences[0].pushNotifications;
      const emailUpdatesEnabled =
        preferences.length > 0 && preferences[0].emailUpdates;

      // Create push notification if enabled
      if (pushNotificationsEnabled) {
        await storage.createNotification({
          ...data,
          userId,
        });
      }

      // Send email notification if enabled
      if (emailUpdatesEnabled) {
        try {
          await sendNotificationEmail({
            email: user[0].email,
            title: data.title,
            message: data.message,
            type: data.type,
          });
        } catch (emailError) {
          console.error("Failed to send notification email:", emailError);
          // Continue with other notifications even if email fails
        }
      }
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

// Predefined notification templates
export const notificationTemplates = {
  classAdded: (className: string, actorName: string) => ({
    title: "Class Added",
    message: `**${actorName}** created the class "${className}".`,
    type: "success" as const,
    entityType: "class" as const,
    actorName,
    action: "created",
  }),

  classUpdated: (className: string, actorName: string) => ({
    title: "Class Updated",
    message: `**${actorName}** updated the class "${className}".`,
    type: "info" as const,
    entityType: "class" as const,
    actorName,
    action: "updated",
  }),

  classDeleted: (className: string, actorName: string) => ({
    title: "Class Deleted",
    message: `**${actorName}** deleted the class "${className}".`,
    type: "warning" as const,
    entityType: "class" as const,
    actorName,
    action: "deleted",
  }),

  studentAdded: (
    studentName: string,
    className: string,
    actorName: string
  ) => ({
    title: "Student Added",
    message: `**${actorName}** added ${studentName} to class "${className}".`,
    type: "success" as const,
    entityType: "student" as const,
    actorName,
    action: "added",
  }),

  studentDeleted: (studentName: string, actorName: string) => ({
    title: "Student Deleted",
    message: `**${actorName}** deleted ${studentName} from the attendance.`,
    type: "warning" as const,
    entityType: "student" as const,
    actorName,
    action: "deleted",
  }),

  attendanceTaken: (className: string, date: string, actorName: string) => ({
    title: "Attendance Taken",
    message: `**${actorName}** recorded attendance for class "${className}" on ${date}.`,
    type: "success" as const,
    entityType: "attendance" as const,
    actorName,
    action: "recorded",
  }),

  attendanceUpdated: (className: string, date: string, actorName: string) => ({
    title: "Attendance Updated",
    message: `**${actorName}** updated attendance records for class "${className}" on ${date}.`,
    type: "info" as const,
    entityType: "attendance" as const,
    actorName,
    action: "updated",
  }),

  userPendingApproval: (userName: string, userEmail: string) => ({
    title: "User Approval",
    message: `${userName} (${userEmail}) has registered and is waiting for approval.`,
    type: "warning" as const,
    entityType: "user" as const,
    action: "pending",
  }),

  userApproved: (userName: string, actorName: string) => ({
    title: "User Approved",
    message: `**${actorName}** approved ${userName} as a new user.`,
    type: "success" as const,
    entityType: "user" as const,
    actorName,
    action: "approved",
  }),

  userRejected: (userName: string, actorName: string) => ({
    title: "User Rejected",
    message: `**${actorName}** rejected ${userName}'s registration.`,
    type: "warning" as const,
    entityType: "user" as const,
    actorName,
    action: "rejected",
  }),

  userDeleted: (userName: string, actorName: string) => ({
    title: "User Deleted",
    message:
      userName === actorName
        ? `**${actorName}** deleted his/her account.`
        : `**${actorName}** deleted ${userName} from the system.`,
    type: "warning" as const,
    entityType: "user" as const,
    actorName,
    action: "deleted",
  }),

  userUpgradedToAdmin: (userName: string, actorName: string) => ({
    title: "User Upgraded to Admin",
    message: `**${actorName}** upgraded ${userName} to admin.`,
    type: "success" as const,
    entityType: "user" as const,
    actorName,
    action: "upgraded",
  }),

  syncCompleted: (itemsSynced: number) => ({
    title: "Sync Completed",
    message: `Successfully synced ${itemsSynced} items when connection was restored.`,
    type: "success" as const,
  }),

  offlineMode: () => ({
    title: "Offline Mode",
    message:
      "You are currently working offline. Changes will be synced when connection is restored.",
    type: "warning" as const,
  }),

  onlineRestored: () => ({
    title: "Connection Restored",
    message:
      "Internet connection has been restored. Syncing pending changes...",
    type: "success" as const,
  }),

  scheduledReportCreated: (email: string, type: string, actorName: string) => ({
    title: "Scheduled Report Created",
    message: `**${actorName}** scheduled a ${type} report to be sent to ${email}.`,
    type: "success" as const,
    entityType: "attendance" as const,
    actorName,
    action: "scheduled",
  }),

  scheduledReportStopped: (email: string, type: string, actorName: string) => ({
    title: "Scheduled Report Stopped",
    message: `**${actorName}** stopped the ${type} report scheduled for ${email}.`,
    type: "warning" as const,
    entityType: "attendance" as const,
    actorName,
    action: "stopped",
  }),

  scheduledReportResumed: (email: string, type: string, actorName: string) => ({
    title: "Scheduled Report Resumed",
    message: `**${actorName}** resumed the ${type} report scheduled for ${email}.`,
    type: "success" as const,
    entityType: "attendance" as const,
    actorName,
    action: "resumed",
  }),

  scheduledReportRemoved: (email: string, type: string, actorName: string) => ({
    title: "Scheduled Report Removed",
    message: `**${actorName}** removed the ${type} report scheduled for ${email}.`,
    type: "warning" as const,
    entityType: "attendance" as const,
    actorName,
    action: "removed",
  }),

  scheduledReportFailed: (email: string, type: string, error: string) => ({
    title: "Scheduled Report Failed",
    message: `Failed to send ${type} report to ${email}. Error: ${error}`,
    type: "error" as const,
    entityType: "attendance" as const,
    action: "failed",
  }),
};
