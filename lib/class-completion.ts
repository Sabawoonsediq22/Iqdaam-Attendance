import { db } from "@/lib/db";
import { classes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getNextAcademicClassName, isAcademicClass, isLastAcademicClass } from "./class-names";

/**
 * Check if today is the first day of the month
 */
function isFirstDayOfMonth(): boolean {
  const today = new Date();
  return today.getDate() === 1;
}

/**
 * Automatically rename classes to the next level in the academic sequence.
 * This runs on the 1st of each month.
 * - Step 1 -> Step 2, Step 2 -> Step 3, Step 3 -> Step 4, Step 4 -> Ladder 1
 * - Ladder 1 -> Ladder 2, ..., Ladder 4 -> Focus 1
 * - Focus 1 -> Focus 2, ..., Focus 4 -> Top 1
 * - Top 1 -> Top 2, Top 2 -> Top 3, Top 3 -> Master
 * - Master stays as Master (final level)
 * - Skill classes (Computer, Math, Dictation) remain unchanged
 */
export async function renameClassesForNewMonth() {
  // Only run on the first day of the month
  if (!isFirstDayOfMonth()) {
    console.log("Not the first day of the month, skipping class renaming");
    return;
  }

  console.log("Running monthly class renaming...");

  try {
    // Get all academic classes that are not the final level (Master)
    const classesToUpgrade = await db
      .select()
      .from(classes);

    // Filter for academic classes that can be upgraded
    // Must meet both conditions: is academic class AND not the final level AND has been running for at least 1 month
    const today = new Date();
    const upgradeableClasses = classesToUpgrade.filter((cls) => {
      if (!isAcademicClass(cls.name) || isLastAcademicClass(cls.name)) {
        return false;
      }
      
      // Check if at least 1 month has passed since class start date
      if (!cls.startDate) {
        return false;
      }
      const startDate = new Date(cls.startDate);
      const monthsSinceStart = (today.getFullYear() - startDate.getFullYear()) * 12 + today.getMonth() - startDate.getMonth();
      return monthsSinceStart >= 1;
    });

    if (upgradeableClasses.length === 0) {
      console.log("No classes to upgrade this month");
      return;
    }

    console.log(`Found ${upgradeableClasses.length} classes to upgrade`);

    // Use a transaction to ensure atomicity - all or nothing
    await db.transaction(async (tx) => {
      for (const cls of upgradeableClasses) {
        const nextClassName = getNextAcademicClassName(cls.name);
        
        if (nextClassName) {
          await tx
            .update(classes)
            .set({ name: nextClassName })
            .where(eq(classes.id, cls.id));

          console.log(`Renamed class "${cls.name}" to "${nextClassName}"`);
        }
      }
    });

    console.log(`Successfully upgraded ${upgradeableClasses.length} classes`);
  } catch (error) {
    console.error("Error renaming classes:", error);
    throw error;
  }
}


