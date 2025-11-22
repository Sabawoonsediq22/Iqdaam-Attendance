import { config } from 'dotenv';

config({ path: '../.env.local' });


import { db } from '../lib/storage';
import { notifications } from '../lib/schema';
import { lt } from 'drizzle-orm';

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