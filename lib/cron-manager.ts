import * as cron from "node-cron";
import { processScheduledReports } from "@/app/api/reports/schedule/route";
import { cleanupOldNotifications } from "./cleanup";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  task: () => Promise<void>;
  running: boolean;
  lastRun?: Date;
  nextRun?: Date;
  error?: string;
}

class CronManager {
  private jobs: Map<string, CronJob> = new Map();
  private cronInstances: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeDefaultJobs();
  }

  private initializeDefaultJobs() {
    // Report scheduler - runs every minute to check for due reports
    this.addJob({
      id: "report-scheduler",
      name: "Scheduled Reports Processor",
      schedule: "* * * * *", // Every minute
      task: async () => {
        console.log("Running scheduled reports processor...");
        await processScheduledReports();
      },
    });

    // Daily cleanup - runs at 2 AM every day
    this.addJob({
      id: "daily-cleanup",
      name: "Daily Cleanup",
      schedule: "0 2 * * *", // 2 AM daily
      task: async () => {
        console.log("Running daily cleanup...");
        await cleanupOldNotifications();
      },
    });
  }

  addJob(jobConfig: Omit<CronJob, "running" | "lastRun" | "nextRun" | "error">) {
    const job: CronJob = {
      ...jobConfig,
      running: false,
    };

    this.jobs.set(job.id, job);
    this.scheduleJob(job);
  }

  private scheduleJob(job: CronJob) {
    try {
      const cronTask = cron.schedule(job.schedule, async () => {
        job.running = true;
        job.lastRun = new Date();
        job.error = undefined;

        try {
          await job.task();
          job.nextRun = this.getNextRunTime(job.schedule);
        } catch (error) {
          console.error(`Cron job ${job.name} failed:`, error);
          job.error = error instanceof Error ? error.message : "Unknown error";
        } finally {
          job.running = false;
        }
      });

      this.cronInstances.set(job.id, cronTask);
      job.nextRun = this.getNextRunTime(job.schedule);
    } catch (error) {
      console.error(`Failed to schedule job ${job.name}:`, error);
      job.error = error instanceof Error ? error.message : "Failed to schedule";
    }
  }

  startJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    const cronTask = this.cronInstances.get(jobId);

    if (!job || !cronTask) {
      return false;
    }

    try {
      cronTask.start();
      job.running = false; // Will be set to true when actually running
      job.error = undefined;
      console.log(`Started cron job: ${job.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to start job ${job.name}:`, error);
      job.error = error instanceof Error ? error.message : "Failed to start";
      return false;
    }
  }

  stopJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    const cronTask = this.cronInstances.get(jobId);

    if (!job || !cronTask) {
      return false;
    }

    try {
      cronTask.stop();
      job.running = false;
      console.log(`Stopped cron job: ${job.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to stop job ${job.name}:`, error);
      return false;
    }
  }

  startAllJobs() {
    for (const jobId of this.jobs.keys()) {
      this.startJob(jobId);
    }
    console.log("All cron jobs started");
  }

  stopAllJobs() {
    for (const jobId of this.jobs.keys()) {
      this.stopJob(jobId);
    }
    console.log("All cron jobs stopped");
  }

  async runJobNow(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    try {
      job.running = true;
      job.lastRun = new Date();
      job.error = undefined;

      await job.task();
      job.nextRun = this.getNextRunTime(job.schedule);
      job.running = false;

      console.log(`Manually executed cron job: ${job.name}`);
      return true;
    } catch (error) {
      console.error(`Manual execution of job ${job.name} failed:`, error);
      job.error = error instanceof Error ? error.message : "Execution failed";
      job.running = false;
      return false;
    }
  }

  getJobStatus(jobId: string): CronJob | null {
    return this.jobs.get(jobId) || null;
  }

  getAllJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  private getNextRunTime(cronExpression: string): Date | undefined {
    try {
      // This is a simplified calculation - in production you might want more accurate calculation
      const now = new Date();
      const parts = cronExpression.split(" ");

      if (parts.length !== 5) return undefined;

      const [minute, hour, day, month, dayOfWeek] = parts;

      // For simplicity, we'll just add approximate times
      // A more robust solution would parse the cron expression properly
      if (cronExpression === "* * * * *") {
        // Every minute
        return new Date(now.getTime() + 60000);
      } else if (cronExpression === "0 2 * * *") {
        // Daily at 2 AM
        const nextRun = new Date(now);
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(2, 0, 0, 0);
        return nextRun;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  // Graceful shutdown
  destroy() {
    this.stopAllJobs();
    for (const cronTask of this.cronInstances.values()) {
      cronTask.destroy();
    }
    this.jobs.clear();
    this.cronInstances.clear();
  }
}

// Singleton instance
export const cronManager = new CronManager();

// Initialize cron jobs when the module is imported
if (typeof window === "undefined") {
  // Only run on server side
  cronManager.startAllJobs();
}