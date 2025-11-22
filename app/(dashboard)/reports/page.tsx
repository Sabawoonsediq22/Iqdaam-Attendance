import ReportsClient from "@/components/reports-client";
import { storage } from "@/lib/storage";
import type { Student, Class } from "@/lib/schema";

export default async function ReportsPage() {
  const students: Student[] = await storage.getAllStudents();
  const classes: Class[] = await storage.getAllClasses();

  return (
    <ReportsClient
      students={students}
      classes={classes}
    />
  );
}