"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Play,
  Square,
  RotateCcw,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  running: boolean;
  lastRun?: string;
  nextRun?: string;
  error?: string;
}

export default function CronManagementPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/cron");
      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch cron jobs:", error);
      toast.error("Failed to fetch cron jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAction = async (action: string, jobId?: string) => {
    try {
      const response = await fetch("/api/cron", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, jobId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchJobs(); // Refresh the jobs list
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (error) {
      console.error("Failed to execute action:", error);
      toast.error("Failed to execute action");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (job: CronJob) => {
    if (job.error) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (job.running) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = (job: CronJob) => {
    if (job.error) {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (job.running) {
      return <Badge variant="secondary">Running</Badge>;
    }
    return <Badge variant="default">Idle</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cron Job Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage automated tasks and scheduled jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleAction("start")}>
            <Play className="h-4 w-4 mr-2" />
            Start All
          </Button>
          <Button variant="outline" onClick={() => handleAction("stop")}>
            <Square className="h-4 w-4 mr-2" />
            Stop All
          </Button>
          <Button variant="outline" onClick={fetchJobs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job)}
                      {getStatusBadge(job)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{job.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {job.schedule}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(job.lastRun)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(job.nextRun)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction("run", job.id)}
                        disabled={job.running}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction("start", job.id)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction("stop", job.id)}
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Cron Expression Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Field Order</h4>
              <code className="text-sm bg-muted p-2 rounded block">
                * * * * *
              </code>
              <p className="text-sm text-muted-foreground mt-1">
                minute hour day month day-of-week
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Common Examples</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <code>* * * * *</code> - Every minute
                </div>
                <div>
                  <code>0 * * * *</code> - Every hour
                </div>
                <div>
                  <code>0 9 * * 1</code> - Every Monday at 9 AM
                </div>
                <div>
                  <code>0 2 * * *</code> - Daily at 2 AM
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
