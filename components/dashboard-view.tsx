/* eslint-disable react/no-unescaped-entities */
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import {
  Users,
  TrendingUp,
  Calendar,
  UserX,
  Clock,
  CheckCircle,
  Activity,
  BarChart3,
  Zap,
  Target,
  RefreshCw,
  ChevronRight,
  Plus,
  ArrowRight,
  Phone,
  BookOpen,
} from "lucide-react";
import { AttendanceBadge } from "@/components/attendance-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getStudentAvatarSrc } from "@/lib/utils";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import type { Student, Attendance, Class } from "@/lib/schema";
import { Loader } from "@/components/loader";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { format, subDays, eachDayOfInterval } from "date-fns";
import Link from "next/link";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import EditStudentModal from "@/components/EditStudentModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { toast } from "sonner";

interface Stats {
  totalStudents: number;
  todayAttendanceRate: string;
  weekAttendanceRate: string;
  absentToday: number;
  presentToday: number;
  lateToday: number;
}

/**
 * The single dashboard experience, shared by the `/` and `/dashboard` routes.
 * Route files stay thin wrappers so both URLs always render the same screen.
 */
export default function DashboardView() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAbsentModalOpen, setIsAbsentModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: allAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate attendance trends for the last 7 days
  const attendanceTrends = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  }).map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayAttendance = allAttendance.filter((a) => a.date === dateStr);
    const present = dayAttendance.filter((a) => a.status === "present").length;
    const total = dayAttendance.length;
    const rate = total > 0 ? (present / total) * 100 : 0;

    return {
      date: format(date, "MMM dd"),
      attendance: Math.round(rate),
      present,
      total,
    };
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const todayAttendance = allAttendance.filter((a) => a.date === today);

  // Sort by recordedAt descending to show most recent first
  const sortedTodayAttendance = todayAttendance.sort(
    (a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  const recentActivity = sortedTodayAttendance.slice(0, 8).map((att) => {
    const student = students.find((s) => s.id === att.studentId);
    const studentClass = classes.find((c) => c.id === att.classId);
    return {
      id: att.id,
      student,
      name: student?.name || "Unknown Student",
      avatar: student?.avatar || null,
      gender: student?.gender || "male",
      status: att.status as "present" | "absent" | "late",
      time: format(new Date(att.recordedAt), "h:mm a"),
      class: studentClass?.name || "Unknown Class",
    };
  });

  const absentStudents = todayAttendance
    .filter((att) => att.status === "absent")
    .map((att) => {
      const student = students.find((s) => s.id === att.studentId);
      const studentClass = classes.find((c) => c.id === att.classId);
      return {
        id: att.studentId,
        name: student?.name || "Unknown Student",
        fatherName: student?.fatherName || "Unknown",
        phone: student?.phone || "N/A",
        avatar: student?.avatar || null,
        gender: student?.gender || "male",
        class: studentClass?.name || "Unknown Class",
      };
    });

  const attendanceDistribution = [
    {
      name: "Present",
      value: stats?.presentToday || 0,
      color: "hsl(var(--success))",
    },
    {
      name: "Late",
      value: stats?.lateToday || 0,
      color: "hsl(var(--warning))",
    },
    {
      name: "Absent",
      value: stats?.absentToday || 0,
      color: "hsl(var(--destructive))",
    },
  ];

  // Calculate dynamic trends
  const todayRate = attendanceTrends[6]?.attendance || 0;
  const yesterdayRate = attendanceTrends[5]?.attendance || 0;
  const todayTrend = todayRate - yesterdayRate;
  const todayTrendText =
    todayTrend > 0
      ? `+${todayTrend.toFixed(1)}%`
      : todayTrend < 0
      ? `${todayTrend.toFixed(1)}%`
      : "0.0%";
  const todayTrendTone =
    todayTrend > 0
      ? "text-success"
      : todayTrend < 0
      ? "text-destructive"
      : "text-muted-foreground";

  // For week trend, compare first half vs second half of the week
  const weekFirstHalf =
    attendanceTrends.slice(0, 3).reduce((sum, d) => sum + d.attendance, 0) / 3;
  const weekSecondHalf =
    attendanceTrends.slice(3, 7).reduce((sum, d) => sum + d.attendance, 0) / 4;
  const weekTrend = weekSecondHalf - weekFirstHalf;
  const weekTrendText =
    weekTrend > 0
      ? `+${weekTrend.toFixed(1)}%`
      : weekTrend < 0
      ? `${weekTrend.toFixed(1)}%`
      : "0.0%";
  const weekTrendTone =
    weekTrend > 0
      ? "text-success"
      : weekTrend < 0
      ? "text-destructive"
      : "text-muted-foreground";
  const weekTrendRotation = weekTrend < 0 ? "rotate-180" : "";

  // Subtle token-based tints based on trends
  const todayCardBg =
    todayTrend < 0
      ? "bg-linear-to-br from-destructive/10 via-destructive/5 to-transparent"
      : "bg-linear-to-br from-success/10 via-success/5 to-transparent";
  const weekCardBg =
    weekTrend > 0
      ? "bg-linear-to-br from-success/10 via-success/5 to-transparent"
      : weekTrend < 0
      ? "bg-linear-to-br from-destructive/10 via-destructive/5 to-transparent"
      : "bg-linear-to-br from-warning/10 via-warning/5 to-transparent";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRefresh = () => {
    refetchStats();
    setLastRefresh(new Date());
  };

  const handleEdit = () => {
    setIsStudentDetailsOpen(false);
    setIsEditModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedStudent) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete student");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      await queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });

      toast.success("Student deleted successfully");

      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete student"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (statsLoading && !stats) {
    return (
      <Card>
        <CardContent className="py-12">
          <Loader variant="skeleton" shape="dashboard" className="max-w-none" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 lg:p-8">
        <div className="relative z-10 space-y-4">
          <PageHeader
            title={`${getGreeting()}! 👋`}
            description="Welcome to your attendance dashboard. Here's what's happening today."
            actions={
              <>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/attendance">
                    <Plus />
                    Quick Attendance
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/reports">
                    <BarChart3 />
                    View Reports
                  </Link>
                </Button>
              </>
            }
          />
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span>Last updated: {format(lastRefresh, "h:mm a")}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="w-fit"
            >
              <RefreshCw />
              Refresh
            </Button>
          </div>
        </div>

        {/* Background decoration - Responsive */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-primary/5 rounded-full -translate-y-16 translate-x-16 sm:-translate-y-24 sm:translate-x-24 lg:-translate-y-32 lg:translate-x-32 blur-2xl sm:blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 bg-primary/5 rounded-full translate-y-12 -translate-x-12 sm:translate-y-18 sm:-translate-x-18 lg:translate-y-24 lg:-translate-x-24 blur-xl sm:blur-2xl" />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="stats-students" className="relative bg-card shadow">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Students
            </CardTitle>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pb-14 sm:pb-0">
            <div
              className="text-2xl font-semibold tracking-tight"
              data-testid="value-students"
            >
              {stats?.totalStudents || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Currently active students
            </p>
            <div className="mt-3">
              <Progress value={85} className="h-1" />
            </div>
            <Link
              href={"/students"}
              className="absolute bottom-4 right-4 text-xs text-muted-foreground hover:underline sm:right-6"
            >
              View list
              <ArrowRight className="inline-block h-3 w-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card
          data-testid="stats-today's-attendance"
          className={cn("relative bg-card shadow", todayCardBg)}
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Attendance
            </CardTitle>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
              <Target className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-semibold tracking-tight"
              data-testid="value-today's-attendance"
            >
              {stats?.todayAttendanceRate || 0}%
            </div>
            <p className={cn("mt-1 flex items-center gap-1 text-xs", todayTrendTone)}>
              <TrendingUp className="h-3 w-3" />
              {todayTrendText} from yesterday
            </p>
            <div className="mt-3">
              <Progress
                value={parseFloat(stats?.todayAttendanceRate || "0")}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card
          data-testid="stats-this-week"
          className={cn("relative bg-card shadow", weekCardBg)}
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
              <Calendar className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-semibold tracking-tight"
              data-testid="value-this-week"
            >
              {stats?.weekAttendanceRate || 0}%
            </div>
            <p className={cn("mt-1 flex items-center gap-1 text-xs", weekTrendTone)}>
              <TrendingUp className={cn("h-3 w-3", weekTrendRotation)} />
              {weekTrendText} from last week
            </p>
            <div className="mt-3">
              <Progress
                value={parseFloat(stats?.weekAttendanceRate || "0")}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stats-absent-today" className="flex flex-col bg-card shadow">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Absent Today
            </CardTitle>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <UserX className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div
              className="text-2xl font-semibold tracking-tight"
              data-testid="value-absent-today"
            >
              {stats?.absentToday || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Students marked absent
            </p>
            <div className="mt-3">
              <Progress
                value={
                  ((stats?.absentToday || 0) / (stats?.totalStudents || 1)) *
                  100
                }
                className="h-1"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 self-end px-2"
              onClick={() => setIsAbsentModalOpen(true)}
            >
              View list
              <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Attendance Trends Chart */}
        <Card className="lg:col-span-2 shadow">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                  <span className="truncate">Attendance Trends</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Last 7 days performance
                </p>
              </div>
              <Badge variant="info" className="w-fit">
                Live Data
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={300} minWidth={300}>
                <AreaChart data={attendanceTrends}>
                  <defs>
                    <linearGradient
                      id="attendanceGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--chart-1))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--chart-1))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#attendanceGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Distribution Pie Chart */}
        <Card className="shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">Today's Distribution</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Present vs Absent breakdown
            </p>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="w-full">
              <ResponsiveContainer width="100%" height={250} minWidth={250}>
                <PieChart>
                  <Pie
                    data={attendanceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {attendanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4">
              {attendanceDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium truncate">
                    {item.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="shadow">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <span className="truncate">Recent Activity</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Today's attendance records
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="w-fit">
                <Link href="/attendance" className="flex items-center gap-1">
                  View All
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {recentActivity.length === 0 ? (
              <EmptyState
                bare
                icon={Activity}
                title="No recent activity"
                description="Attendance records will appear here"
              />
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (activity.student) {
                      setSelectedStudent(activity.student);
                      setIsStudentDetailsOpen(true);
                    }
                  }}
                  data-testid={`activity-${activity.id}`}
                >
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-background shrink-0">
                    <AvatarImage
                      src={getStudentAvatarSrc(activity.avatar, activity.gender)}
                      alt={activity.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                      {getInitials(activity.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm sm:text-base">
                      {activity.name}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {activity.class}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 sm:gap-2 shrink-0">
                    <AttendanceBadge status={activity.status} />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & System Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary shrink-0" />
                <span className="truncate">Quick Actions</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Common tasks and shortcuts
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6">
              <Button
                variant="outline"
                className="w-full justify-start h-auto gap-3 p-3 sm:p-4"
                onClick={() => setIsAbsentModalOpen(true)}
              >
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-semibold text-sm sm:text-base truncate">
                    View today's absent students
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    See who is marked absent today
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start h-auto gap-3 p-3 sm:p-4"
              >
                <Link href="/attendance" className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base truncate">
                      Take Attendance
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      Mark students present or absent
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start h-auto gap-3 p-3 sm:p-4"
              >
                <Link href="/students" className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base truncate">
                      Manage Students
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      Add or edit student information
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full justify-start h-auto gap-3 p-3 sm:p-4"
              >
                <Link href="/reports" className="flex items-center gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base truncate">
                      View Reports
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      Generate detailed attendance reports
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="shadow">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Services</span>
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Version</span>
                <Badge variant="secondary">1.0.0</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <StudentDetailsModal
        student={selectedStudent}
        isOpen={isStudentDetailsOpen}
        onClose={() => setIsStudentDetailsOpen(false)}
        onEdit={handleEdit}
      />

      <EditStudentModal
        student={selectedStudent}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
        }}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Student"
        description={`Are you sure you want to delete ${selectedStudent?.name}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />

      <ResponsiveDialog
        open={isAbsentModalOpen}
        onOpenChange={setIsAbsentModalOpen}
        title="Absent Students Today"
        description="Students marked absent in today's attendance records."
        contentClassName="sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {absentStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No students are absent today.
          </p>
        ) : (
          <ul className="space-y-3">
            {absentStudents.map((student) => (
              <li
                key={student.id}
                className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-16 w-16 border-2 border-background shrink-0">
                  <AvatarImage
                    src={getStudentAvatarSrc(student.avatar, student.gender)}
                    alt={student.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-sm truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {student.fatherName}
                  </p>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold text-sm truncate">
                      {student.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">
                      {student.class}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ResponsiveDialog>
    </div>
  );
}
