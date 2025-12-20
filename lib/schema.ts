import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  date,
  boolean,
  unique,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Relationships: Many-to-many with students via studentClasses, one-to-many with attendance
export const classes = pgTable("classes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  teacher: text("teacher").notNull(),
  time: text("time").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: text("status").notNull().default("active"), // 'active', 'completed', 'upgraded', 'cancelled'
  description: text("description"),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

// Relationships: Many-to-many with classes via studentClasses, one-to-many with attendance
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
});

// Relationships: Junction table for many-to-many between students and classes
export const studentClasses = pgTable(
  "student_classes",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    studentId: varchar("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classId: varchar("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    uniqueStudentClass: unique("unique_student_class").on(
      table.studentId,
      table.classId
    ),
  })
);

// Relationships: Many-to-one with students, many-to-one with classes
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

// Relationships: Many-to-one with students, many-to-one with classes
export const fees = pgTable(
  "fees",
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
    feeToBePaid: decimal("fee_to_be_paid", {
      precision: 10,
      scale: 2,
    }).notNull(),
    feePaid: decimal("fee_paid", { precision: 10, scale: 2 }),
    feeUnpaid: decimal("fee_unpaid", { precision: 10, scale: 2 }),
    paymentDate: date("payment_date"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    uniqueStudentClassFee: unique("unique_student_class_fee").on(
      table.studentId,
      table.classId
    ),
  })
);

// Relationships: One-to-many with reportAttendance, generatedBy references users.id
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

// Relationships: Junction table for many-to-many between reports and attendance
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

// Relationships: One-to-many with userPreferences, referenced by reports.generatedBy, notifications.userId
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

// Relationships: Many-to-one with users (userId), entityId references various entities
export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'success', 'error', 'warning', 'info', 'class', 'student', 'attendance', 'fee'
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

// Relationships: References users.email (not foreign key)
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

// Relationships: Many-to-one with users
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
  fee: (schema) => schema.min(0, "Fee must be non-negative"),
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

export const insertStudentClassSchema = createInsertSchema(studentClasses).omit(
  {
    id: true,
    enrolledAt: true,
  }
);

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

export const insertFeeSchema = createInsertSchema(fees, {
  studentId: (schema) =>
    schema.min(1, "Student selection is required").uuid("Invalid student ID"),
  classId: (schema) =>
    schema.min(1, "Class selection is required").uuid("Invalid class ID"),
  feeToBePaid: (schema) =>
    schema
      .min(0.01, "Fee amount must be greater than 0")
      .max(99999999.99, "Fee amount is too large"),
  feePaid: (schema) =>
    schema
      .optional()
      .refine(
        (val) => val === undefined || val === "" || parseFloat(val) >= 0,
        {
          message: "Amount paid must be non-negative",
        }
      )
      .refine(
        (val) =>
          val === undefined || val === "" || parseFloat(val) <= 99999999.99,
        {
          message: "Amount paid is too large",
        }
      ),
  feeUnpaid: (schema) =>
    schema
      .optional()
      .refine(
        (val) => val === undefined || val === "" || parseFloat(val) >= 0,
        {
          message: "Unpaid amount must be non-negative",
        }
      )
      .refine(
        (val) =>
          val === undefined || val === "" || parseFloat(val) <= 99999999.99,
        {
          message: "Unpaid amount is too large",
        }
      ),
  paymentDate: (schema) =>
    schema.min(1, "Payment date is required").refine(
      (val) => {
        const paymentDate = new Date(val);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return paymentDate <= today;
      },
      {
        message: "Payment date cannot be in the future",
      }
    ),
})
  .omit({
    id: true,
    createdAt: true,
  })
  .refine(
    (data) => {
      if (data.feePaid && data.feePaid !== "") {
        const paid = parseFloat(data.feePaid);
        const total = parseFloat(data.feeToBePaid);
        return paid <= total;
      }
      return true;
    },
    {
      message: "Amount paid cannot exceed the fee amount",
      path: ["feePaid"],
    }
  );

export const updateFeeSchema = createInsertSchema(fees, {
  feeToBePaid: (schema) =>
    schema
      .optional()
      .refine(
        (val) => val === undefined || val === "" || parseFloat(val) > 0,
        {
          message: "Fee amount must be greater than 0",
        }
      )
      .refine(
        (val) =>
          val === undefined || val === "" || parseFloat(val) <= 99999999.99,
        {
          message: "Fee amount is too large",
        }
      ),
  feePaid: (schema) =>
    schema
      .optional()
      .refine(
        (val) => val === undefined || val === "" || parseFloat(val) >= 0,
        {
          message: "Amount paid must be non-negative",
        }
      )
      .refine(
        (val) =>
          val === undefined || val === "" || parseFloat(val) <= 99999999.99,
        {
          message: "Amount paid is too large",
        }
      ),
  feeUnpaid: (schema) =>
    schema
      .optional()
      .refine(
        (val) => val === undefined || val === "" || parseFloat(val) >= 0,
        {
          message: "Unpaid amount must be non-negative",
        }
      )
      .refine(
        (val) =>
          val === undefined || val === "" || parseFloat(val) <= 99999999.99,
        {
          message: "Unpaid amount is too large",
        }
      ),
  paymentDate: (schema) =>
    schema.optional().refine(
      (val) => {
        if (!val || val === "") return true;
        const paymentDate = new Date(val);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return paymentDate <= today;
      },
      {
        message: "Payment date cannot be in the future",
      }
    ),
}).omit({
  id: true,
  createdAt: true,
  studentId: true,
  classId: true,
});

// Combined schema for creating students with class assignment
export const insertStudentWithClassSchema = insertStudentSchema.extend({
  classId: z.string().min(1, "Class selection is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export type InsertStudentWithClass = z.infer<
  typeof insertStudentWithClassSchema
>;

export type InsertStudentClass = z.infer<typeof insertStudentClassSchema>;
export type StudentClass = typeof studentClasses.$inferSelect;

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

export type InsertFee = z.infer<typeof insertFeeSchema>;
export type UpdateFee = z.infer<typeof updateFeeSchema>;
export type Fee = typeof fees.$inferSelect;
