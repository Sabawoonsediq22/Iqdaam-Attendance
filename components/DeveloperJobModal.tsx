"use client";

import { useState, useEffect } from "react";
import { Play, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type JobStatus = "idle" | "loading" | "success" | "error";

interface Job {
  id: string;
  name: string;
  path: string;
  schedule: string;
  description: string;
  status: JobStatus;
}

/** Per-status card tint + button treatment, kept token-based for dark mode. */
const jobStatusStyles: Record<
  JobStatus,
  { card: string; button: "default" | "destructive" | "secondary"; buttonClass?: string }
> = {
  idle: { card: "", button: "default" },
  loading: { card: "border-info/40", button: "secondary" },
  success: {
    card: "border-success/40 bg-success/5",
    button: "default",
    buttonClass: "bg-success text-success-foreground hover:bg-success/90",
  },
  error: { card: "border-destructive/40 bg-destructive/5", button: "destructive" },
};

export default function DeveloperJobModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  // Load available jobs from API
  const loadJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await fetch("/api/cron");
      const data = await response.json();
      if (data.success) {
        setJobs(
          data.jobs.map((job: Omit<Job, "status">) => ({
            ...job,
            status: "idle" as JobStatus,
          })),
        );
      } else {
        toast.error("Failed to load jobs");
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Execute a job
  const executeJob = async (jobId: string) => {
    // Find the job
    const jobIndex = jobs.findIndex((job) => job.id === jobId);
    if (jobIndex === -1) return;

    // Update job status to loading
    const updatedJobs = [...jobs];
    updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], status: "loading" };
    setJobs(updatedJobs);

    try {
      const job = jobs[jobIndex];
      const response = await fetch(job.path);
      const data = await response.json();

      if (data.success) {
        // Update job status to success
        updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], status: "success" };
        setJobs(updatedJobs);
        toast.success("Job executed successfully");

        // Reset status after 3 seconds
        setTimeout(() => {
          updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], status: "idle" };
          setJobs([...updatedJobs]);
        }, 3000);
      } else {
        // Update job status to error
        updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], status: "error" };
        setJobs(updatedJobs);
        toast.error(data.error || "Failed to execute job");
      }
    } catch (error) {
      console.error("Error executing job:", error);
      // Update job status to error
      updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], status: "error" };
      setJobs(updatedJobs);
      toast.error("Failed to execute job");
    }
  };

  // Keyboard listener for opening the modal
  useEffect(() => {
    // Desktop shortcut: Ctrl+Shift+J or Cmd+Shift+J
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
        e.preventDefault();
        setIsOpen(true);
        loadJobs();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            >
              <Play className="h-4 w-4" />
            </span>
            <span>Developer Job Runner</span>
          </DialogTitle>
          <DialogDescription>
            Execute maintenance jobs manually. Jobs run in the background.
          </DialogDescription>
        </DialogHeader>

        {isLoadingJobs ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading jobs...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No jobs available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const styles = jobStatusStyles[job.status];
              return (
                <Card key={job.id} className={`p-4 ${styles.card}`}>
                  <div className="mb-3">
                    <h3 className="text-sm font-medium">{job.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {job.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Schedule: {job.schedule}
                    </p>
                  </div>
                  <Button
                    onClick={() => executeJob(job.id)}
                    disabled={job.status === "loading"}
                    size="sm"
                    variant={styles.button}
                    className={cn("w-full", styles.buttonClass)}
                  >
                    {job.status === "loading" ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Running...
                      </>
                    ) : job.status === "success" ? (
                      <>
                        <Check />
                        Success
                      </>
                    ) : job.status === "error" ? (
                      <>
                        <AlertCircle />
                        Failed
                      </>
                    ) : (
                      <>
                        <Play />
                        Run Job
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        <CardContent className="rounded-md bg-muted/50 p-3 text-center text-xs text-muted-foreground">
          <p>
            Press <strong className="font-semibold">Ctrl+Shift+J</strong> or{" "}
            <strong className="font-semibold">Cmd+Shift+J</strong> to open/close
          </p>
          <p className="mt-1">
            Press <strong className="font-semibold">Esc</strong>, click{" "}
            <strong className="font-semibold">X</strong>, or triple-tap on screen to
            close
          </p>
          <p className="mt-1">Mobile: Triple-tap anywhere to open/close</p>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}
