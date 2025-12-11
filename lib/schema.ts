import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  date,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const classes = pgTable("classes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  teacher: text("teacher").notNull(),
  time: text("time").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  description: text("description"),
});

export const students = pgTable("students", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: text("student_id"),
  name: text("name").notNull(),
  fatherName: text("father_name").notNull(),
  phone: text("phone"),
  gender: text("gender").notNull(),
  email: text("email"),
  avatar: text("avatar"),
  classId: varchar("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
});

export const attendance = pgTable(
  "attendance",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    studentId: varchar("student_id")
      .notNull()
      .references(() => students.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    classId: varchar("class_id")
      .notNull()
      .references(() => classes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    date: date("date").notNull(),
    status: text("status").notNull(),
    recordedAt: timestamp("recorded_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    uniqueAttendance: unique("unique_attendance_class_student_date").on(
      table.classId,
      table.studentId,
      table.date
    ),
  })
);

export const reports = pgTable("reports", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'daily', 'weekly', 'monthly', 'custom'
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  generatedBy: varchar("generated_by").notNull(), // User ID who generated the report
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

// Many-to-many relationship between reports and attendance
export const reportAttendance = pgTable("report_attendance", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reportId: varchar("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  attendanceId: varchar("attendance_id")
    .notNull()
    .references(() => attendance.id, { onDelete: "cascade" }),
  notes: text("notes"),
});

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  role: text("role").notNull(), // 'admin', 'teacher'
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'success', 'error', 'warning', 'info', 'class', 'student', 'attendance'
  entityType: text("entity_type"), // 'class', 'student', 'attendance'
  entityId: varchar("entity_id"),
  actorName: text("actor_name"),
  action: text("action"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  userId: varchar("user_id"), // For future multi-user support
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(), // 6-digit numeric code
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  emailUpdates: boolean("email_updates").notNull().default(false),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const insertClassSchema = createInsertSchema(classes, {
  name: (schema) => schema.min(1, "Class name is required"),
  teacher: (schema) => schema.min(1, "Teacher is required"),
  time: (schema) => schema.min(1, "Time is required"),
  startDate: (schema) => schema.min(1, "Start date is required"),
}).omit({
  id: true,
});

export const insertStudentSchema = createInsertSchema(students, {
  name: (schema) => schema.min(1, "Name is required"),
  fatherName: (schema) => schema.min(1, "Father's name is required"),
  gender: (schema) => schema.min(1, "Gender is required"),
  studentId: (schema) => schema.optional(),
}).omit({
  id: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  recordedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportAttendanceSchema = createInsertSchema(
  reportAttendance
).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users, {
  isApproved: (schema) => schema.optional().default(false),
}).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetCodeSchema = createInsertSchema(
  passwordResetCodes
).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(
  userPreferences
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertReportAttendance = z.infer<
  typeof insertReportAttendanceSchema
>;
export type ReportAttendance = typeof reportAttendance.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertPasswordResetCode = z.infer<
  typeof insertPasswordResetCodeSchema
>;
export type PasswordResetCode = typeof passwordResetCodes.$inferSelect;

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
