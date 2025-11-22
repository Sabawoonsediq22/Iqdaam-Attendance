import { config } from 'dotenv';

config({ path: '../.env.local' });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { notifications } from '../lib/schema';
import { lt } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
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

    console.log(`Deleted ${result.rowCount} old notifications`);
    console.log('Notification cleanup completed!');
  } catch (error) {
    console.error('Error during notification cleanup:', error);
    process.exit(1);
  }
}

cleanupNotifications().catch(console.error);