import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { notifications } from "./schema";
import { lt } from "drizzle-orm";

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

export async function cleanupOldNotifications(): Promise<void> {
  console.log("Starting notification cleanup...");

  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // Delete notifications older than 7 days
    await getDb()
      .delete(notifications)
      .where(lt(notifications.createdAt, sevenDaysAgo));

    console.log("Notification cleanup completed successfully!");
  } catch (error) {
    console.error("Error during notification cleanup:", error);
    throw error;
  }
}
