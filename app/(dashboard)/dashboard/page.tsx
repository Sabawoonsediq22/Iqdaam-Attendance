/* eslint-disable react/no-unescaped-entities */
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { AttendanceBadge } from "@/components/attendance-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
      status: att.status as "present" | "absent" | "late",
      time: format(new Date(att.recordedAt), "h:mm a"),
      class: studentClass?.name || "Unknown Class",
    };
  });

  const attendanceDistribution = [
    { name: "Present", value: stats?.presentToday || 0, color: "#00C49F" },
    { name: "Late", value: stats?.lateToday || 0, color: "#FFBB28" },
    { name: "Absent", value: stats?.absentToday || 0, color: "#FF8042" },
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
  const todayTrendColor =
    todayTrend > 0
      ? "text-green-500"
      : todayTrend < 0
      ? "text-red-500"
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
  const weekTrendColor =
    weekTrend > 0
      ? "text-green-500"
      : weekTrend < 0
      ? "text-red-500"
      : "text-muted-foreground";
  const weekTrendRotation = weekTrend < 0 ? "rotate-180" : "";

  // Dynamic card backgrounds based on trends
  const todayCardBg =
    todayTrend > 0
      ? "from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20"
      : todayTrend < 0
      ? "from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/20"
      : "from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20";
  const weekCardBg =
    weekTrend > 0
      ? "from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20"
      : weekTrend < 0
      ? "from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/20"
      : "from-yellow-50 to-yellow-100/50 dark:from-yellow-950/50 dark:to-yellow-900/20";

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
      <div className="col-span-full flex justify-center py-12">
        <Loader size="md" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 lg:p-8 border border-primary/20">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {getGreeting()}! 👋
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-md">
                Welcome to your attendance dashboard. Here's what's happening
                today.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <span>Last updated: {format(lastRefresh, "HH:mm")}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-8 px-2 w-fit"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                asChild
                className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer w-full sm:w-auto"
              >
                <Link href="/attendance">
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Attendance
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="shadow-sm cursor-pointer w-full sm:w-auto"
              >
                <Link href="/reports">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background decoration - Responsive */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-primary/5 rounded-full -translate-y-16 translate-x-16 sm:-translate-y-24 sm:translate-x-24 lg:-translate-y-32 lg:translate-x-32 blur-2xl sm:blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 bg-primary/5 rounded-full translate-y-12 -translate-x-12 sm:translate-y-18 sm:-translate-x-18 lg:translate-y-24 lg:-translate-x-24 blur-xl sm:blur-2xl" />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg bg-linear-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {stats?.totalStudents || 0}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                  Across all classes
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={85} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`relative overflow-hidden border-0 shadow-lg bg-linear-to-br ${todayCardBg}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Today's Attendance
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {stats?.todayAttendanceRate || 0}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className={`h-3 w-3 ${todayTrendColor}`} />
                  <span
                    className={`text-xs ${todayTrendColor} dark:${todayTrendColor.replace(
                      "text-",
                      ""
                    )}`}
                  >
                    {todayTrendText} from yesterday
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={parseFloat(stats?.todayAttendanceRate || "0")}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`relative overflow-hidden border-0 shadow-lg bg-linear-to-br ${weekCardBg}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  This Week
                </p>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {stats?.weekAttendanceRate || 0}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp
                    className={`h-3 w-3 ${weekTrendColor} ${weekTrendRotation}`}
                  />
                  <span
                    className={`text-xs ${weekTrendColor} dark:${weekTrendColor.replace(
                      "text-",
                      ""
                    )}`}
                  >
                    {weekTrendText} from last week
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={parseFloat(stats?.weekAttendanceRate || "0")}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-linear-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Absent Today
                </p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                  {stats?.absentToday || 0}
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                  Students marked absent
                </p>
              </div>
              <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4">
              <Progress
                value={
                  ((stats?.absentToday || 0) / (stats?.totalStudents || 1)) *
                  100
                }
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attendance Trends Chart */}
        <Card className="lg:col-span-2 border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                  <span className="truncate">Attendance Trends</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Last 7 days performance
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 w-fit"
              >
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
                      <stop offset="5%" stopColor="#0088FE" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
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
                    stroke="#0088FE"
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
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-lg">
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
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  attendance records will appear here
                </p>
              </div>
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
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-background shadow-sm shrink-0">
                    <AvatarImage
                      src={activity.avatar || undefined}
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
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary shrink-0" />
                <span className="truncate">Quick Actions</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Common tasks and shortcuts
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start h-auto p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
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
                className="w-full justify-start h-auto p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
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
                className="w-full justify-start h-auto p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
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
          <Card className="border-0 shadow-lg bg-linear-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Services</span>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Version</span>
                <span className="text-sm text-muted-foreground">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    1.0.0
                  </Badge>
                </span>
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
    </div>
  );
}
