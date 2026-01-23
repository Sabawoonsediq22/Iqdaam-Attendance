"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  image?: string;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceBadge } from "@/components/attendance-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  Mail,
  Loader2,
  Clock,
  Play,
  Square,
  Trash2,
} from "lucide-react";
import { Loader } from "@/components/loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStudentAvatarSrc } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Student, Class } from "@/lib/schema";

interface ReportStudent {
  id: string;
  name: string;
  studentId: string | null;
  avatar: string | null;
  gender: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: string;
  student?: ReportStudent;
  class?: {
    id: string;
    name: string;
  };
}

interface ChartData {
  date?: string;
  class?: string;
  student?: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

interface ReportData {
  type: string;
  startDate: string;
  endDate: string;
  summary: {
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: number;
  };
  attendance: AttendanceRecord[];
  charts: {
    byDate: ChartData[];
    byClass: ChartData[];
    byStudent: ChartData[];
  };
}

interface ScheduledReport {
  id: string;
  type: "weekly" | "monthly";
  email: string;
  classId?: string;
  studentId?: string;
  createdAt: string;
  nextRun: string;
  isActive: boolean;
}

interface Props {
  students: Student[];
  classes: Class[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function ReportsClient({ students, classes }: Props) {
  const router = useRouter();
  const { data: session } = useSession();

  // Redirect teachers to attendance page
  useEffect(() => {
    if ((session?.user as ExtendedUser)?.role === "teacher") {
      router.push("/attendance");
    }
  }, [session, router]);

  const [reportType, setReportType] = useState("daily");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");

  // Scheduling
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleType, setScheduleType] = useState<"weekly" | "monthly">(
    "weekly"
  );
  const [scheduling, setScheduling] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(
    []
  );

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(startDate && { startDate: format(startDate, "yyyy-MM-dd") }),
        ...(endDate && { endDate: format(endDate, "yyyy-MM-dd") }),
        ...(selectedClass &&
          selectedClass !== "all" && { classId: selectedClass }),
        ...(selectedStudent &&
          selectedStudent !== "all" && { studentId: selectedStudent }),
      });

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error("Failed to fetch report");

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, startDate, endDate, selectedClass, selectedStudent]);

  const getInitials = (name?: string) => {
    return (
      (name || "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvContent = [
      ["Date", "Student", "Student ID", "Class", "Status"],
      ...reportData.attendance.map((record) => [
        record.date,
        record.student?.name || "Unknown",
        record.student?.studentId || "Unknown",
        record.class?.name || "Unknown",
        record.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${reportType}-${format(
      new Date(),
      "yyyy-MM-dd"
    )}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const data = reportData.attendance.map((record) => ({
      Date: record.date,
      Student: record.student?.name || "Unknown",
      "Student ID": record.student?.studentId || "Unknown",
      Class: record.class?.name || "Unknown",
      Status: record.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
    XLSX.writeFile(
      wb,
      `attendance-report-${reportType}-${format(new Date(), "yyyy-MM-dd")}.xlsx`
    );
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    doc.text(`Attendance Report - ${reportType.toUpperCase()}`, 20, 10);

    const tableData = reportData.attendance.map((record) => [
      record.date,
      record.student?.name || "Unknown",
      record.student?.studentId || "Unknown",
      record.class?.name || "Unknown",
      record.status,
    ]);

    autoTable(doc, {
      head: [["Date", "Student", "Student ID", "Class", "Status"]],
      body: tableData,
      startY: 20,
    });

    doc.save(
      `attendance-report-${reportType}-${format(new Date(), "yyyy-MM-dd")}.pdf`
    );
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedClass("all");
    setSelectedStudent("all");
  };

  const fetchScheduledReports = async () => {
    try {
      const response = await fetch("/api/reports/schedule");
      if (!response.ok) throw new Error("Failed to fetch scheduled reports");

      const data = await response.json();
      setScheduledReports(data.scheduledReports || []);
      setManageDialogOpen(true);
    } catch (error) {
      console.error("Error fetching scheduled reports:", error);
      toast.error("Failed to load scheduled reports");
    }
  };

  const manageScheduledReport = async (
    id: string,
    action: "stop" | "resume" | "remove"
  ) => {
    try {
      if (action === "remove") {
        const response = await fetch(`/api/reports/schedule?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to remove scheduled report");

        toast.success("Scheduled report removed successfully!");
      } else {
        const response = await fetch(`/api/reports/schedule?id=${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        });

        if (!response.ok) throw new Error("Failed to update scheduled report");

        toast.success(`Scheduled report ${action}d successfully!`);
      }

      // Refresh the list
      await fetchScheduledReports();
    } catch (error) {
      console.error(`Error ${action}ing scheduled report:`, error);
      toast.error(`Failed to ${action} scheduled report`);
    }
  };

  const scheduleReport = async () => {
    if (!scheduleEmail || !scheduleType) return;

    setScheduling(true);
    try {
      const response = await fetch("/api/reports/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: scheduleType,
          email: scheduleEmail,
          classId: selectedClass !== "all" ? selectedClass : undefined,
          studentId: selectedStudent !== "all" ? selectedStudent : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to schedule report");

      toast.success("Report scheduled successfully!");
      setScheduleDialogOpen(false);
      setScheduleEmail("");
    } catch (error) {
      console.error("Error scheduling report:", error);
      toast.error("Failed to schedule report");
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-muted-foreground mt-1">
            View and analyze attendance data with comprehensive reports
          </p>
        </div>
        <div className="flex gap-2 flex-wrap ml-auto">
          <Button variant="outline" onClick={fetchReport} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Clock className="h-4 w-4" />
                Schedule Reports
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Schedule Options</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    setScheduleType("weekly");
                    setScheduleDialogOpen(true);
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Schedule Weekly Report
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setScheduleType("monthly");
                    setScheduleDialogOpen(true);
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Schedule Monthly Report
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => fetchScheduledReports()}>
                  <Clock className="h-4 w-4 mr-2" />
                  Manage Scheduled Reports
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Email Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={scheduleEmail}
                    onChange={(e) => setScheduleEmail(e.target.value)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Reports will be sent automatically based on current filters.
                  {scheduleType === "weekly"
                    ? "Weekly reports are sent every Sunday at 9 AM."
                    : "Monthly reports are sent on the 1st of each month at 9 AM."}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setScheduleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={scheduleReport}
                    disabled={scheduling || !scheduleEmail}
                  >
                    {scheduling && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {scheduling ? "Scheduling..." : "Schedule Report"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-4xl h-[95vh] max-h-[95vh] p-4 sm:p-6">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-lg sm:text-xl">
                  Manage Scheduled Reports
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto max-h-[calc(95vh-140px)]">
                {scheduledReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No scheduled reports found
                  </p>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-md border border-card-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Next Run</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scheduledReports.map((report: ScheduledReport) => (
                            <TableRow key={report.id}>
                              <TableCell
                                className="font-medium max-w-[200px] truncate"
                                title={report.email}
                              >
                                {report.email}
                              </TableCell>
                              <TableCell className="capitalize">
                                {report.type}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    report.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {report.isActive ? "Active" : "Stopped"}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(report.nextRun), "PPP 'at' p")}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {report.isActive ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        manageScheduledReport(report.id, "stop")
                                      }
                                      className="h-8 w-8 p-0"
                                      title="Stop report"
                                    >
                                      <Square className="h-3 w-3" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        manageScheduledReport(
                                          report.id,
                                          "resume"
                                        )
                                      }
                                      className="h-8 w-8 p-0"
                                      title="Resume report"
                                    >
                                      <Play className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      manageScheduledReport(report.id, "remove")
                                    }
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    title="Remove report"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {scheduledReports.map((report: ScheduledReport) => (
                        <Card key={report.id} className="p-4 shadow-sm">
                          <div className="space-y-4">
                            {/* Header with email and status */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p
                                  className="font-semibold text-sm wrap-break-word leading-tight"
                                  title={report.email}
                                >
                                  {report.email}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="capitalize text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {report.type}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                      report.isActive
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                    }`}
                                  >
                                    {report.isActive ? "Active" : "Stopped"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Next run info */}
                            <div className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Next Run
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {format(
                                      new Date(report.nextRun),
                                      "MMM dd, yyyy 'at' HH:mm"
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-3 border-t border-border/50">
                              {report.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    manageScheduledReport(report.id, "stop")
                                  }
                                  className="flex-1 h-9 text-xs font-medium"
                                >
                                  <Square className="h-3 w-3 mr-1.5" />
                                  Stop
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    manageScheduledReport(report.id, "resume")
                                  }
                                  className="flex-1 h-9 text-xs font-medium"
                                >
                                  <Play className="h-3 w-3 mr-1.5" />
                                  Resume
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  manageScheduledReport(report.id, "remove")
                                }
                                className="flex-1 h-9 text-xs font-medium text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40"
                              >
                                <Trash2 className="h-3 w-3 mr-1.5" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
                <div className="flex gap-2 justify-end pt-4 border-t mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setManageDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="cursor-pointer bg-gray-100">
                <Download className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={exportToExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={exportToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  if (!isNaN(date.getTime())) {
                    setStartDate(date);
                  } else {
                    setStartDate(undefined);
                  }
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  if (!isNaN(date.getTime())) {
                    setEndDate(date);
                  } else {
                    setEndDate(undefined);
                  }
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Student</label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader text="please wait..." />
          </CardContent>
        </Card>
      )}

      {reportData && !loading && (
        <>
          {/* Summary Statistics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Total Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-primary">
                  {reportData.summary.totalRecords}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {reportData.startDate} to {reportData.endDate}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Attendance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-primary">
                  {reportData.summary.attendanceRate.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Present + Late / Total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Total Present
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-attendance-present">
                  {reportData.summary.presentCount}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Student days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Total Absent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-attendance-absent">
                  {reportData.summary.absentCount}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Student days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="data">Data Table</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends by Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.charts.byDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="present" stackId="a" fill="#00C49F" />
                      <Bar dataKey="late" stackId="a" fill="#FFBB28" />
                      <Bar dataKey="absent" stackId="a" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Present Students by Class</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Number of students marked present in each class
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={classes
                              .map((cls, index) => {
                                const chartData =
                                  reportData.charts.byClass.find(
                                    (c) => c.class === cls.name
                                  );
                                return {
                                  name: cls.name,
                                  present: chartData?.present || 0,
                                  absent: chartData?.absent || 0,
                                  late: chartData?.late || 0,
                                  total: chartData?.total || 0,
                                  fill: COLORS[index % COLORS.length],
                                };
                              })
                              .filter(
                                (item) =>
                                  item.present > 0 ||
                                  item.absent > 0 ||
                                  item.late > 0
                              )}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="present"
                          >
                            {classes
                              .map((cls, index) => {
                                const chartData =
                                  reportData.charts.byClass.find(
                                    (c) => c.class === cls.name
                                  );
                                const hasData =
                                  (chartData?.present || 0) > 0 ||
                                  (chartData?.absent || 0) > 0 ||
                                  (chartData?.late || 0) > 0;
                                return hasData ? (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                ) : null;
                              })
                              .filter(Boolean)}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              `${value} students present`,
                              `Class: ${name}`,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend at bottom left */}
                    <div className="mt-4 flex justify-start">
                      {(() => {
                        const classesWithData = classes.filter((cls) => {
                          const chartData = reportData.charts.byClass.find(
                            (c) => c.class === cls.name
                          );
                          const present = chartData?.present || 0;
                          const absent = chartData?.absent || 0;
                          const late = chartData?.late || 0;
                          return present > 0 || absent > 0 || late > 0;
                        });

                        // Group into chunks of 4
                        const chunks = [];
                        for (let i = 0; i < classesWithData.length; i += 4) {
                          chunks.push(classesWithData.slice(i, i + 4));
                        }

                        return (
                          <div className="flex gap-3">
                            {chunks.map((chunk, chunkIndex) => (
                              <div key={chunkIndex} className="flex flex-col">
                                {chunk.map((cls) => {
                                  const globalIndex = classes.findIndex(
                                    (c) => c.id === cls.id
                                  );
                                  return (
                                    <div
                                      key={cls.id}
                                      className="flex items-center gap-1.5"
                                    >
                                      <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{
                                          backgroundColor:
                                            COLORS[globalIndex % COLORS.length],
                                        }}
                                      />
                                      <span className="text-[0.60rem] font-medium">
                                        {cls.name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status Distribution</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Overall attendance status breakdown across all records
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Present",
                              value: reportData.summary.presentCount,
                              color: "#00C49F",
                            },
                            {
                              name: "Late",
                              value: reportData.summary.lateCount,
                              color: "#FFBB28",
                            },
                            {
                              name: "Absent",
                              value: reportData.summary.absentCount,
                              color: "#FF8042",
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            {
                              name: "Present",
                              value: reportData.summary.presentCount,
                              color: "#00C49F",
                            },
                            {
                              name: "Late",
                              value: reportData.summary.lateCount,
                              color: "#FFBB28",
                            },
                            {
                              name: "Absent",
                              value: reportData.summary.absentCount,
                              color: "#FF8042",
                            },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData.attendance.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No attendance records found for the selected filters
                    </p>
                  ) : (
                    <div className="rounded-md border border-card-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead className="hidden sm:table-cell">
                              Class
                            </TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.attendance.map((record, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                  {record.date}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 hidden md:block">
                                    <AvatarImage
                                      src={getStudentAvatarSrc(record.student?.avatar ?? null, record.student?.gender as string | null)}
                                      alt={record.student?.name ?? "Unknown"}
                                    />
                                    <AvatarFallback>
                                      {getInitials(record.student?.name || "U")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {record.student?.name || "Unknown Student"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground hidden sm:table-cell">
                                {record.class?.name || "Unknown Class"}
                              </TableCell>
                              <TableCell>
                                <AttendanceBadge
                                  status={
                                    record.status as
                                      | "present"
                                      | "absent"
                                      | "late"
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
