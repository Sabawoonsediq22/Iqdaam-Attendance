"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type JobStatus = "idle" | "loading" | "success" | "error";

interface Job {
  id: string;
  name: string;
  path: string;
  schedule: string;
  description: string;
  status: JobStatus;
}

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
          }))
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
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl + Shift + J (Windows/Linux) or Cmd + Shift + J (macOS)
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
    <AnimatePresence>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md w-full max-h-[80vh] overflow-y-auto p-0 border-0 shadow-2xl rounded-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-linear-to-r from-gray-900 to-gray-800 text-white">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-400" />
                Developer Job Runner
              </DialogTitle>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoadingJobs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading jobs...</span>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No jobs available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Select a job to execute manually. Jobs will run in the
                    background.
                  </p>

                  {jobs.map((job) => (
                    <Card
                      key={job.id}
                      className={`p-4 border transition-all duration-300 ${
                        job.status === "success"
                          ? "border-green-500 bg-green-50"
                          : job.status === "error"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {job.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {job.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Schedule: {job.schedule}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => executeJob(job.id)}
                          disabled={job.status === "loading"}
                          size="sm"
                          className={`flex-1 ${
                            job.status === "loading"
                              ? "bg-blue-500 text-white"
                              : job.status === "success"
                              ? "bg-green-500 text-white"
                              : job.status === "error"
                              ? "bg-red-500 text-white"
                              : "bg-gray-900 text-white hover:bg-gray-800"
                          }`}
                        >
                          {job.status === "loading" ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Running...
                            </>
                          ) : job.status === "success" ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Success
                            </>
                          ) : job.status === "error" ? (
                            <>
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Failed
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Run Job
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 text-xs text-gray-500 text-center rounded-b-2xl">
              <p>Press <strong>Ctrl+Shift+J</strong> or <strong>Cmd+Shift+J</strong> to open/close</p>
              <p className="mt-1">Press <strong>Esc</strong> or click <strong>X</strong> to close</p>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}