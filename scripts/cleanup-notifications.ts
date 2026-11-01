import { config } from 'dotenv';

config({ path: './.env.local' });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { notifications } from '../lib/schema';
import { lt } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function cleanupNotifications() {
  console.log('Starting notification cleanup...');

  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // Delete notifications older than 7 days
    const result = await db
      .delete(notifications)
      .where(lt(notifications.createdAt, sevenDaysAgo));

    // postgres-js results expose the affected-row count as `count`
    const deleted = (result as { count?: number }).count ?? 0;

    console.log(`Deleted ${deleted} old notifications`);
    console.log('Notification cleanup completed!');
  } catch (error) {
    console.error('Error during notification cleanup:', error);
    process.exit(1);
  }
}

cleanupNotifications().catch(console.error);