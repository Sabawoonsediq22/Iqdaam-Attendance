import { storage } from "./storage";

export interface NotificationData {
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info" | "class" | "student" | "attendance";
  entityType?: "class" | "student" | "attendance" | "user";
  entityId?: string;
  actorName?: string;
  action?: string;
}

export const createNotification = async (data: NotificationData) => {
  try {
    await storage.createNotification({
      ...data,
      userId: undefined, // For future multi-user support
    });
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

  classDeleted: (className: string, actorName: string) => ({
    title: "Class Deleted",
    message: `**${actorName}** deleted the class "${className}".`,
    type: "warning" as const,
    entityType: "class" as const,
    actorName,
    action: "deleted",
  }),

  studentAdded: (studentName: string, className: string, actorName: string) => ({
    title: "Student Added",
    message: `**${actorName}** added ${studentName} to class "${className}".`,
    type: "success" as const,
    entityType: "student" as const,
    actorName,
    action: "added",
  }),

  studentDeleted: (studentName: string, actorName: string) => ({
    title: "Student Removed",
    message: `**${actorName}** removed ${studentName} from the attendance.`,
    type: "warning" as const,
    entityType: "student" as const,
    actorName,
    action: "removed",
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
    title: "New User Pending Approval",
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
    message: userName === actorName ? `**${actorName}** deleted his/her account.` : `**${actorName}** deleted ${userName} from the system.`,
    type: "warning" as const,
    entityType: "user" as const,
    actorName,
    action: "deleted",
  }),

  syncCompleted: (itemsSynced: number) => ({
    title: "Sync Completed",
    message: `Successfully synced ${itemsSynced} items when connection was restored.`,
    type: "success" as const,
  }),

  offlineMode: () => ({
    title: "Offline Mode",
    message: "You are currently working offline. Changes will be synced when connection is restored.",
    type: "warning" as const,
  }),

  onlineRestored: () => ({
    title: "Connection Restored",
    message: "Internet connection has been restored. Syncing pending changes...",
    type: "success" as const,
  }),
};