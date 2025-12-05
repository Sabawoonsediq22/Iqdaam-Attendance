import {
  type Class,
  type InsertClass,
  type Student,
  type InsertStudent,
  type Attendance,
  type InsertAttendance,
  type Notification,
  type InsertNotification,
  classes,
  students,
  attendance,
  notifications,
} from "./schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, SQL } from "drizzle-orm";

let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const client = postgres(process.env.DATABASE_URL);
    db = drizzle(client);
  }
  return db;
}

export interface IStorage {
  getClass(id: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  createClass(cls: InsertClass): Promise<Class>;
  updateClass(
    id: string,
    cls: Partial<InsertClass>
  ): Promise<Class | undefined>;
  deleteClass(id: string): Promise<boolean>;

  getStudent(id: string): Promise<Student | undefined>;
  getStudentsByClass(classId: string): Promise<Student[]>;
  getAllStudents(): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(
    id: string,
    student: Partial<InsertStudent>
  ): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;
  deleteStudentsByClass(classId: string): Promise<boolean>;

  getAttendance(id: string): Promise<Attendance | undefined>;
  getAttendanceByClassAndDate(
    classId: string,
    date: string
  ): Promise<Attendance[]>;
  getAttendanceByClassAndDateParts(
    classId: string,
    day: string,
    month: string,
    year: string
  ): Promise<Attendance[]>;
  getAttendanceByStudent(studentId: string): Promise<Attendance[]>;
  getFilteredAttendance(conditions: SQL[]): Promise<Attendance[]>;
  getAllAttendance(): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(
    id: string,
    attendance: Partial<InsertAttendance>
  ): Promise<Attendance | undefined>;
  deleteAttendance(id: string): Promise<boolean>;
  deleteAttendanceByClass(classId: string): Promise<boolean>;
  bulkCreateAttendance(attendances: InsertAttendance[]): Promise<Attendance[]>;
  bulkUpsertAttendance(attendances: InsertAttendance[]): Promise<Attendance[]>;

  getAllNotifications(): Promise<Notification[]>;
  getNotificationsForUser(userId: string): Promise<Notification[]>;
  getUnreadNotificationsCount(): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<boolean>;
  markAllNotificationsAsRead(): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;
}

export class DrizzleStorage implements IStorage {
  async getClass(id: string): Promise<Class | undefined> {
    const result = await getDb()
      .select()
      .from(classes)
      .where(eq(classes.id, id))
      .limit(1);
    return result[0];
  }

  async getAllClasses(): Promise<Class[]> {
    return await getDb().select().from(classes);
  }

  async createClass(cls: InsertClass): Promise<Class> {
    const result = await getDb().insert(classes).values(cls).returning();
    return result[0];
  }

  async updateClass(
    id: string,
    cls: Partial<InsertClass>
  ): Promise<Class | undefined> {
    const result = await getDb()
      .update(classes)
      .set(cls)
      .where(eq(classes.id, id))
      .returning();
    return result[0];
  }

  async deleteClass(id: string): Promise<boolean> {
    const result = await getDb()
      .delete(classes)
      .where(eq(classes.id, id))
      .returning();
    return result.length > 0;
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const result = await getDb()
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1);
    return result[0];
  }

  async getStudentsByClass(classId: string): Promise<Student[]> {
    return await getDb()
      .select()
      .from(students)
      .where(eq(students.classId, classId));
  }

  async getAllStudents(): Promise<Student[]> {
    return await getDb().select().from(students);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    // Filter out empty studentId to avoid unique constraint violation
    const studentData = { ...student };
    if (!studentData.studentId || studentData.studentId.trim() === "") {
      delete studentData.studentId;
    }
    const result = await getDb()
      .insert(students)
      .values(studentData)
      .returning();
    return result[0];
  }

  async updateStudent(
    id: string,
    student: Partial<InsertStudent>
  ): Promise<Student | undefined> {
    const result = await getDb()
      .update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return result[0];
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await getDb()
      .delete(students)
      .where(eq(students.id, id))
      .returning();
    return result.length > 0;
  }

  async deleteStudentsByClass(classId: string): Promise<boolean> {
    const result = await getDb()
      .delete(students)
      .where(eq(students.classId, classId))
      .returning();
    return result.length >= 0; // Always true since it can delete 0 or more
  }

  async getAttendance(id: string): Promise<Attendance | undefined> {
    const result = await getDb()
      .select()
      .from(attendance)
      .where(eq(attendance.id, id))
      .limit(1);
    return result[0];
  }

  async getAttendanceByClassAndDate(
    classId: string,
    date: string
  ): Promise<Attendance[]> {
    return await getDb()
      .select()
      .from(attendance)
      .where(and(eq(attendance.classId, classId), eq(attendance.date, date)));
  }

  async getAttendanceByClassAndDateParts(
    classId: string,
    day: string,
    month: string,
    year: string
  ): Promise<Attendance[]> {
    return await getDb()
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.classId, classId),
          eq(attendance.day, day),
          eq(attendance.month, month),
          eq(attendance.year, year)
        )
      );
  }

  async getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
    return await getDb()
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, studentId));
  }

  async getFilteredAttendance(conditions: SQL[]): Promise<Attendance[]> {
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    return await getDb().select().from(attendance).where(whereClause);
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return await getDb().select().from(attendance);
  }

  async createAttendance(
    attendanceData: InsertAttendance
  ): Promise<Attendance> {
    const result = await getDb()
      .insert(attendance)
      .values(attendanceData)
      .returning();
    return result[0];
  }

  async updateAttendance(
    id: string,
    attendanceData: Partial<InsertAttendance>
  ): Promise<Attendance | undefined> {
    const result = await getDb()
      .update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return result[0];
  }

  async deleteAttendance(id: string): Promise<boolean> {
    const result = await getDb()
      .delete(attendance)
      .where(eq(attendance.id, id))
      .returning();
    return result.length > 0;
  }

  async deleteAttendanceByClass(classId: string): Promise<boolean> {
    const result = await getDb()
      .delete(attendance)
      .where(eq(attendance.classId, classId))
      .returning();
    return result.length >= 0; // Always true since it can delete 0 or more
  }

  async bulkCreateAttendance(
    attendances: InsertAttendance[]
  ): Promise<Attendance[]> {
    return await getDb().insert(attendance).values(attendances).returning();
  }

  async bulkUpsertAttendance(
    attendances: InsertAttendance[]
  ): Promise<Attendance[]> {
    if (attendances.length === 0) return [];

    // Get the classId, day, month, year from the first record (they should all be the same)
    const { classId, day, month, year } = attendances[0];

    // Delete existing attendance records for this class/date combination
    await getDb()
      .delete(attendance)
      .where(
        and(
          eq(attendance.classId, classId),
          eq(attendance.day, day),
          eq(attendance.month, month),
          eq(attendance.year, year)
        )
      );

    // Insert the new attendance records
    return await getDb().insert(attendance).values(attendances).returning();
  }

  async getAllNotifications(): Promise<Notification[]> {
    return await getDb()
      .select()
      .from(notifications)
      .orderBy(notifications.createdAt)
      .limit(100);
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return await getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt)
      .limit(100);
  }

  async getUnreadNotificationsCount(): Promise<number> {
    const result = await getDb()
      .select()
      .from(notifications)
      .where(eq(notifications.isRead, false));
    return result.length;
  }

  async createNotification(
    notification: InsertNotification
  ): Promise<Notification> {
    const result = await getDb()
      .insert(notifications)
      .values(notification)
      .returning();
    return result[0];
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await getDb()
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result.length > 0;
  }

  async markAllNotificationsAsRead(): Promise<boolean> {
    const result = await getDb()
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.isRead, false))
      .returning();
    return result.length > 0;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await getDb()
      .delete(notifications)
      .where(eq(notifications.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DrizzleStorage();
