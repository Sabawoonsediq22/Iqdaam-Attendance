"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { StatsCard } from "@/components/stats-card";
import { EmptyState } from "@/components/empty-state";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Check,
  ChevronsUpDown,
  Hash,
  Percent,
  UserCheck,
  UserX,
  Inbox,
} from "lucide-react";
import { Loader } from "@/components/loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStudentAvatarSrc, cn } from "@/lib/utils";
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

/* Chart palette derived from the design tokens so charts match the app
   in both light and dark mode. */
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

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
  const [studentOpen, setStudentOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  // Client-side filtering so users can find a student quickly among hundreds
  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => {
      const haystack = `${student.name} ${student.fatherName} ${
        student.studentId ?? ""
      }`.toLowerCase();
      return haystack.includes(query);
    });
  }, [students, studentQuery]);

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
      <PageHeader
        description="View and analyze attendance data with comprehensive reports"
        actions={
          <>
            <Button variant="outline" onClick={fetchReport} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Refresh
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Clock />
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
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                    >
                      <Mail className="h-4 w-4" />
                    </span>
                    <span>Schedule Email Report</span>
                  </DialogTitle>
                  <DialogDescription>
                    Reports are sent automatically using the filters currently
                    applied.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={scheduleEmail}
                      onChange={(e) => setScheduleEmail(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {scheduleType === "weekly"
                      ? "Weekly reports are sent every Sunday at 9 AM."
                      : "Monthly reports are sent on the 1st of each month at 9 AM."}
                  </p>
                </div>
                <DialogFooter className="border-t pt-4">
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
                    {scheduling && <Loader2 className="animate-spin" />}
                    {scheduling ? "Scheduling..." : "Schedule Report"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                    >
                      <Clock className="h-4 w-4" />
                    </span>
                    <span>Manage Scheduled Reports</span>
                  </DialogTitle>
                  <DialogDescription>
                    Pause, resume or remove recurring email reports.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {scheduledReports.length === 0 ? (
                    <EmptyState
                      bare
                      icon={Inbox}
                      title="No scheduled reports"
                      description="Schedule a weekly or monthly report from the Schedule Reports menu."
                    />
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
                                  <Badge
                                    variant={report.isActive ? "success" : "danger"}
                                  >
                                    {report.isActive ? "Active" : "Stopped"}
                                  </Badge>
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
                          <Card key={report.id}>
                            <div className="space-y-4 p-4">
                              {/* Header with email and status */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-sm font-semibold leading-tight"
                                    title={report.email}
                                  >
                                    {report.email}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="secondary" className="capitalize">
                                      {report.type}
                                    </Badge>
                                    <Badge
                                      variant={report.isActive ? "success" : "danger"}
                                    >
                                      {report.isActive ? "Active" : "Stopped"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Next run info */}
                              <div className="rounded-lg bg-muted/50 p-3">
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
                              <div className="flex gap-2 border-t border-border/50 pt-3">
                                {report.isActive ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      manageScheduledReport(report.id, "stop")
                                    }
                                    className="flex-1"
                                  >
                                    <Square />
                                    Stop
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      manageScheduledReport(report.id, "resume")
                                    }
                                    className="flex-1"
                                  >
                                    <Play />
                                    Resume
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    manageScheduledReport(report.id, "remove")
                                  }
                                  className="flex-1 border-destructive/20 text-destructive hover:border-destructive/40 hover:text-destructive"
                                >
                                  <Trash2 />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setManageDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" aria-label="Export report">
                  <Download />
                  Export
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
          </>
        }
      />

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
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
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

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
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

            <div className="space-y-2">
              <Label htmlFor="class-filter">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-filter">
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

            <div className="space-y-2">
              <Label>Student</Label>
              <Popover
                open={studentOpen}
                onOpenChange={(open) => {
                  setStudentOpen(open);
                  if (open) setStudentQuery("");
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={studentOpen}
                    aria-label="Select student"
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {selectedStudent === "all" || !selectedStudentData
                        ? "All Students"
                        : `${selectedStudentData.name}${
                            selectedStudentData.studentId
                              ? ` (${selectedStudentData.studentId})`
                              : ""
                          }`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={false} className="rounded-lg">
                    <CommandInput
                      placeholder="Search by name or student ID..."
                      className="h-11 border-0 shadow-none focus:ring-0"
                      value={studentQuery}
                      onValueChange={setStudentQuery}
                    />
                    <CommandList className="max-h-64">
                      {filteredStudents.length === 0 && (
                        <CommandEmpty>No student found.</CommandEmpty>
                      )}
                      <CommandGroup className="p-2">
                        {!studentQuery.trim() && (
                          <CommandItem
                            value="all-students"
                            onSelect={() => {
                              setSelectedStudent("all");
                              setStudentOpen(false);
                            }}
                            className="p-2.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 shrink-0",
                                selectedStudent === "all"
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="truncate">All Students</span>
                          </CommandItem>
                        )}
                        {filteredStudents.map((student) => (
                          <CommandItem
                            key={student.id}
                            value={`${student.id} ${student.name} ${student.fatherName} ${
                              student.studentId ?? ""
                            }`}
                            onSelect={() => {
                              setSelectedStudent(student.id);
                              setStudentOpen(false);
                            }}
                            className="p-2.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 shrink-0",
                                selectedStudent === student.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="truncate flex-1">
                              {student.name}
                            </span>
                            {student.studentId && (
                              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                {student.studentId}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader
              variant="skeleton"
              shape="reports"
              className="max-w-none"
            />
          </CardContent>
        </Card>
      )}

      {reportData && !loading && (
        <>
          {/* Summary Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Records"
              value={reportData.summary.totalRecords}
              icon={Hash}
              tone="primary"
              description={`${reportData.startDate} to ${reportData.endDate}`}
            />

            <StatsCard
              title="Attendance Rate"
              value={`${reportData.summary.attendanceRate.toFixed(1)}%`}
              icon={Percent}
              tone="primary"
              description="Present + Late / Total"
            />

            <StatsCard
              title="Total Present"
              value={reportData.summary.presentCount}
              icon={UserCheck}
              tone="success"
              description="Student days"
            />

            <StatsCard
              title="Total Absent"
              value={reportData.summary.absentCount}
              icon={UserX}
              tone="danger"
              description="Student days"
            />
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
                      <Bar
                        dataKey="present"
                        stackId="a"
                        fill="hsl(var(--success))"
                      />
                      <Bar
                        dataKey="late"
                        stackId="a"
                        fill="hsl(var(--warning))"
                      />
                      <Bar
                        dataKey="absent"
                        stackId="a"
                        fill="hsl(var(--destructive))"
                      />
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
                            fill="hsl(var(--chart-1))"
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
                                      <span className="text-xs font-medium">
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
                    {(() => {
                      const statusDistribution = [
                        {
                          name: "Present",
                          value: reportData.summary.presentCount,
                          color: "hsl(var(--success))",
                        },
                        {
                          name: "Late",
                          value: reportData.summary.lateCount,
                          color: "hsl(var(--warning))",
                        },
                        {
                          name: "Absent",
                          value: reportData.summary.absentCount,
                          color: "hsl(var(--destructive))",
                        },
                      ];
                      return (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={statusDistribution}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                            >
                              {statusDistribution.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
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
                      );
                    })()}
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
                    <EmptyState
                      bare
                      icon={Inbox}
                      title="No attendance records"
                      description="No records match the selected filters. Try widening the date range or clearing the filters."
                    />
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
