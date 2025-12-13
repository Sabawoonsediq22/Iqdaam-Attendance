import { db } from "@/lib/db";
import { classes } from "@/lib/schema";
import { eq, sql, isNotNull, and } from "drizzle-orm";

export async function checkCompletedClasses() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day
    const todayString = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Find classes where endDate is today or in the past and status is not completed
    const classesToComplete = await db
      .select()
      .from(classes)
      .where(
        and(
          isNotNull(classes.endDate),
          sql`${classes.endDate} <= ${todayString}`,
          eq(classes.status, "active")
        )
      );

    if (classesToComplete.length === 0) {
      console.log("No classes to mark as completed");
      return;
    }

    // Update classes to completed status
    for (const cls of classesToComplete) {
      await db
        .update(classes)
        .set({ status: "completed" })
        .where(eq(classes.id, cls.id));

      console.log(`Marked class "${cls.name}" as completed`);
    }

    console.log(`Completed ${classesToComplete.length} classes`);
  } catch (error) {
    console.error("Error checking completed classes:", error);
    throw error;
  }
}
