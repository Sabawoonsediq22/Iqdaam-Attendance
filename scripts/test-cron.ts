#!/usr/bin/env tsx

/**
 * Test script for cron job functionality
 * Run with: npm run tsx scripts/test-cron.ts
 */

import { cronManager } from "../lib/cron-manager";

async function testCronJobs() {
  console.log("🧪 Testing Cron Job Functionality");
  console.log("=================================");

  // Get all jobs
  const jobs = cronManager.getAllJobs();
  console.log(`📋 Found ${jobs.length} cron jobs:`);

  jobs.forEach((job, index) => {
    console.log(`${index + 1}. ${job.name}`);
    console.log(`   Schedule: ${job.schedule}`);
    console.log(`   Status: ${job.running ? "Running" : "Idle"}`);
    console.log(`   Last Run: ${job.lastRun || "Never"}`);
    console.log(`   Next Run: ${job.nextRun || "Unknown"}`);
    if (job.error) {
      console.log(`   Error: ${job.error}`);
    }
    console.log("");
  });

  // Test manual execution of report scheduler
  console.log("🔄 Testing manual execution of report scheduler...");
  const success = await cronManager.runJobNow("report-scheduler");

  if (success) {
    console.log("✅ Report scheduler executed successfully");
  } else {
    console.log("❌ Report scheduler execution failed");
  }

  // Wait a moment and check status again
  console.log("\n⏳ Waiting 2 seconds...");
  await new Promise(resolve => setTimeout(resolve, 2000));

  const updatedJobs = cronManager.getAllJobs();
  const reportJob = updatedJobs.find(job => job.id === "report-scheduler");

  if (reportJob) {
    console.log("📊 Updated report scheduler status:");
    console.log(`   Last Run: ${reportJob.lastRun || "Never"}`);
    console.log(`   Status: ${reportJob.running ? "Running" : "Idle"}`);
    if (reportJob.error) {
      console.log(`   Error: ${reportJob.error}`);
    }
  }

  console.log("\n🎉 Cron job testing completed!");
  console.log("\n💡 Tips:");
  console.log("   - Cron jobs run automatically when the app starts");
  console.log("   - Use the /cron admin page to manage jobs manually");
  console.log("   - Check server logs for cron job execution details");

  // Graceful shutdown
  cronManager.destroy();
  process.exit(0);
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  cronManager.destroy();
  process.exit(0);
});

// Run the test
testCronJobs().catch((error) => {
  console.error("❌ Test failed:", error);
  cronManager.destroy();
  process.exit(1);
});