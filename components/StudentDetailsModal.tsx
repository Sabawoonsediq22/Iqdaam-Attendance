"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Student,
  Class,
  Attendance,
  StudentClass,
} from "@/lib/schema";
import { Edit, Trash2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import EditFeeModal from "./EditFeeModal";
import { getStudentAvatarSrc } from "@/lib/utils";
import { cn } from "@/lib/utils";

type FeeWithDetails = {
  id: string;
  studentId: string;
  classId: string;
  feeToBePaid: string;
  feePaid: string | null;
  feeUnpaid: string | null;
  paymentDate: Date | null;
  createdAt: Date;
  studentName: string;
  fatherName: string;
  className: string;
  teacherName: string;
};

type RawFee = Omit<FeeWithDetails, "createdAt" | "paymentDate"> & {
  createdAt: string;
  paymentDate: string | null;
};

/* Status tokens aligned with the app's attendance palette */
const statusTile: Record<string, string> = {
  present:
    "border-attendance-present/30 bg-attendance-present/10 text-attendance-present",
  absent: "border-attendance-absent/30 bg-attendance-absent/10 text-attendance-absent",
  late: "border-attendance-late/30 bg-attendance-late/10 text-attendance-late",
};

const statusDot: Record<string, string> = {
  present: "bg-attendance-present",
  absent: "bg-attendance-absent",
  late: "bg-attendance-late",
};

interface StudentDetailsModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onStudentChange?: () => void;
}

// Delete Student Modal Component
function DeleteStudentModal({
  student,
  onSuccess,
}: {
  student: Student;
  onSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete student");
      }
      return res.json();
    },
    onSuccess: () => {
      // Note: We use the studentId from the closure
      // The student prop is stable during this modal's lifecycle
      // Optimistically update the cache by removing the deleted student
      queryClient.setQueryData<Student[]>(["/api/students"], (oldStudents) =>
        oldStudents ? oldStudents.filter((s) => s.id !== student.id) : [],
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });

      toast.success("Student deleted successfully");

      setIsOpen(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete student",
      );
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(student.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="icon"
        aria-label={`Delete ${student.name}`}
        className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DeleteConfirmationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Delete Student"
        description={`Are you sure you want to delete ${student.name}? This action cannot be undone and will also remove all attendance records for this student.`}
        isDeleting={isDeleting}
      />
    </>
  );
}

/* Minimal label-above-value field used in the info grid */
function InfoField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-0.5 truncate text-sm font-medium">{children}</div>
    </div>
  );
}

/* Small stat tile for the attendance summary */
function StatTile({
  label,
  value,
  dot,
}: {
  label: string;
  value: string | number;
  dot: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 shrink-0 rounded-full", dot)} />
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default function StudentDetailsModal({
  student,
  isOpen,
  onClose,
  onEdit,
  onStudentChange,
}: StudentDetailsModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    startOfMonth(new Date()),
  );
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeWithDetails | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: classes = [], error: classesError } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: studentClasses = [], error: studentClassesError } = useQuery<StudentClass[]>({
    queryKey: ["/api/student-classes"],
    enabled: !!student?.id && isOpen,
  });

  const { data: attendance = [], error: attendanceError } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", student?.id],
    queryFn: async () => {
      if (!student?.id) return [];
      const res = await fetch(`/api/attendance?studentId=${student.id}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!student?.id && isOpen,
  });

  const { data: fees = [], error: feesError } = useQuery<FeeWithDetails[]>({
    queryKey: ["/api/fees", student?.id],
    queryFn: async () => {
      if (!student?.id) return [];
      const res = await fetch(`/api/fees?studentId=${student.id}`);
      if (!res.ok) throw new Error("Failed to fetch fees");
      const data: RawFee[] = await res.json();
      return data.map((fee: RawFee) => ({
        ...fee,
        createdAt: new Date(fee.createdAt),
        paymentDate: fee.paymentDate ? new Date(fee.paymentDate) : null,
      }));
    },
    enabled: !!student?.id && isOpen,
  });

  // Show toast errors for query failures
  useEffect(() => {
    if (classesError) toast.error("Failed to load classes");
  }, [classesError]);

  useEffect(() => {
    if (studentClassesError) toast.error("Failed to load student classes");
  }, [studentClassesError]);

  useEffect(() => {
    if (attendanceError) toast.error("Failed to load attendance");
  }, [attendanceError]);

  useEffect(() => {
    if (feesError) toast.error("Failed to load fees");
  }, [feesError]);

  const studentClassesForStudent = useMemo(() => {
    return student
      ? studentClasses.filter((sc: StudentClass) => sc.studentId === student.id)
      : [];
  }, [student, studentClasses]);

  useEffect(() => {
    // Save the previous overflow value to restore it properly
    const previousOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow || "unset";
    };
  }, [isOpen]);

  // Effective selected class: use user selection or auto-select first
  const effectiveSelectedClass = useMemo(() => {
    return selectedClass || (studentClassesForStudent.length > 0 ? studentClassesForStudent[0].classId : "");
  }, [selectedClass, studentClassesForStudent]);

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.name : "Unknown Class";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditFee = (fee: FeeWithDetails | null) => {
    setSelectedFee(fee);
    setIsEditModalOpen(true);
  };

  const handleFeeUpdateSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedFee(null);
  };

  const attendanceStats = useMemo(() => {
    if (!attendance || attendance.length === 0) return { present: 0, absent: 0, late: 0, total: 0 };

    const present = attendance.filter((a) => a?.status === "present").length;
    const absent = attendance.filter((a) => a?.status === "absent").length;
    const late = attendance.filter((a) => a?.status === "late").length;

    return { present, absent, late, total: attendance.length };
  }, [attendance]);

  // Late days count as half attendance for the overall rate
  const attendanceRate = attendanceStats.total
    ? Math.round(
        ((attendanceStats.present + attendanceStats.late / 2) /
          attendanceStats.total) *
          100,
      )
    : 0;

  const filteredAttendance = useMemo(() => {
    return effectiveSelectedClass
      ? attendance.filter((a) => a.classId === effectiveSelectedClass)
      : [];
  }, [attendance, effectiveSelectedClass]);

  const monthlyAttendance = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    return days.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const record = filteredAttendance.find((a) => a.date === dateStr);
      return {
        date,
        dateStr,
        status: record?.status || null,
        dayName: format(date, "EEE"),
        dayNumber: format(date, "d"),
      };
    });
  }, [filteredAttendance, selectedMonth]);

  // Status distribution for the selected month + class
  const monthlyStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    for (const day of monthlyAttendance) {
      if (day.status === "present") present += 1;
      else if (day.status === "absent") absent += 1;
      else if (day.status === "late") late += 1;
    }
    return { present, absent, late, total: present + absent + late };
  }, [monthlyAttendance]);

  const distributionData = [
    { name: "Present", value: monthlyStats.present, color: "hsl(142 71% 45%)" },
    { name: "Absent", value: monthlyStats.absent, color: "hsl(4 90% 58%)" },
    { name: "Late", value: monthlyStats.late, color: "hsl(45 93% 47%)" },
  ];

  if (!student) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Header + tabs */}
          <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-border bg-background">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setShowImageViewer(true)}
                  aria-label="View profile picture"
                  className="cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-border">
                    <AvatarImage
                      src={getStudentAvatarSrc(student.avatar, student.gender)}
                      alt={student.name}
                    />
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                  </Avatar>
                </button>
                <div className="min-w-0">
                  <p className="truncate font-semibold leading-tight">
                    {student.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Student profile
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {onEdit && (
                  <Button
                    onClick={() => {
                      onClose();
                      onEdit();
                    }}
                    variant="outline"
                    size="icon"
                    aria-label="Edit student"
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <DeleteStudentModal
                  student={student!}
                  onSuccess={() => {
                    onStudentChange?.();
                  }}
                />
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  className="cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

              <div className="flex justify-center px-4 pb-3">
                <TabsList className="w-full max-w-md gap-1 rounded-lg bg-muted p-1">
                  <TabsTrigger
                    value="details"
                    aria-label="View student details"
                    className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="monthly"
                    aria-label="View attendance records"
                    className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  >
                    Attendance
                  </TabsTrigger>
                  <TabsTrigger
                    value="fees"
                    aria-label="View fee records"
                    className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  >
                    Fees
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="mx-auto w-full max-w-4xl">
                <TabsContent value="details" className="space-y-4 mt-0">
                  {/* Student information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Student information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                        <InfoField label="Full name">
                          {student.name}
                        </InfoField>
                        <InfoField label="Father's name">
                          {student.fatherName}
                        </InfoField>
                        <InfoField label="Gender">
                          {student.gender}
                        </InfoField>
                        {student.studentId && (
                          <InfoField label="Student ID">
                            <span className="tabular-nums">
                              {student.studentId}
                            </span>
                          </InfoField>
                        )}
                        <InfoField label="Phone">
                          {student.phone || "Not provided"}
                        </InfoField>
                        {student.email && (
                          <InfoField label="Email">
                            {student.email}
                          </InfoField>
                        )}
                      </div>

                      {/* Enrolled classes */}
                      <div className="mt-5 border-t border-border pt-4">
                        <p className="text-xs font-medium text-muted-foreground">
                          Classes
                        </p>
                        {studentClassesForStudent.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {studentClassesForStudent.map((sc) => (
                              <Badge
                                key={sc.id}
                                variant="secondary"
                                className="font-medium"
                              >
                                {getClassName(sc.classId)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm font-medium">
                            No classes assigned
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="monthly" className="space-y-4 mt-0 pb-5">
                  {/* Filters */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex flex-1 flex-col gap-1">
                      <label
                        htmlFor="attendance-month"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Month
                      </label>
                      <Input
                        id="attendance-month"
                        type="month"
                        value={format(selectedMonth, "yyyy-MM")}
                        onChange={(e) => {
                          const date = new Date(e.target.value + "-01");
                          if (!isNaN(date.getTime())) {
                            setSelectedMonth(date);
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Class
                      </label>
                      <Select
                        value={effectiveSelectedClass}
                        onValueChange={setSelectedClass}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {studentClassesForStudent.map((sc) => (
                            <SelectItem key={sc.classId} value={sc.classId}>
                              {getClassName(sc.classId)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Calendar — only when a class is chosen */}
                  {effectiveSelectedClass && (
                    <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {format(selectedMonth, "MMMM yyyy")} —{" "}
                          {getClassName(effectiveSelectedClass)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
                          {/* Fridays are the school weekend — hide from the grid */}
                          {monthlyAttendance
                            .filter((day) => day.date.getDay() !== 5)
                            .map((day) => (
                            <div
                              key={day.dateStr}
                              className={cn(
                                "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center",
                                day.status
                                  ? statusTile[day.status]
                                  : "border-border bg-muted/40 text-muted-foreground",
                              )}
                            >
                              <span className="text-[11px] font-medium">
                                {day.dayName}
                              </span>
                              <span className="text-sm font-semibold leading-none">
                                {day.dayNumber}
                              </span>
                              <span
                                className={cn(
                                  "size-2 rounded-full",
                                  day.status
                                    ? statusDot[day.status]
                                    : "border border-border bg-transparent",
                                )}
                                aria-hidden
                              />
                            </div>
                            ))}
                          </div>

                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                          {Object.entries(statusDot).map(([status, dot]) => (
                            <span
                              key={status}
                              className="flex items-center gap-1.5 capitalize"
                            >
                              <span
                                className={cn("size-2 rounded-full", dot)}
                                aria-hidden
                              />
                              {status}
                            </span>
                          ))}
                          <span className="flex items-center gap-1.5">
                            <span
                              className="size-2 rounded-full border border-border"
                              aria-hidden
                            />
                            No record
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Distribution — scoped to the selected month + class */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                          Attendance distribution —{" "}
                          {format(selectedMonth, "MMMM yyyy")} ·{" "}
                          {getClassName(effectiveSelectedClass)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {monthlyStats.total > 0 ? (
                          <div className="flex flex-col items-center gap-6 sm:flex-row">
                            <ResponsiveContainer
                              width="100%"
                              height={200}
                              className="sm:w-1/2"
                            >
                              <PieChart>
                                <Pie
                                  data={distributionData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ percent }) =>
                                    percent > 5
                                      ? `${(percent * 100).toFixed(0)}%`
                                      : ""
                                  }
                                  outerRadius={65}
                                  dataKey="value"
                                >
                                  {distributionData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value, name) => [
                                    `${value} days`,
                                    name,
                                  ]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="flex w-full flex-col gap-3 sm:w-1/2">
                              {distributionData.map((item) => (
                                <div
                                  key={item.name}
                                  className="flex items-center gap-3"
                                >
                                  <span
                                    className="size-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className="text-sm font-medium">
                                    {item.name}
                                  </span>
                                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                                    {item.value} days
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="py-6 text-center text-sm text-muted-foreground">
                            No attendance records for this month and class yet.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    </>
                  )}

                  {/* Overall summary */}
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">
                      Overall attendance summary
                    </h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <StatTile
                        label="Present days"
                        value={attendanceStats.present}
                        dot="bg-attendance-present"
                      />
                      <StatTile
                        label="Absent days"
                        value={attendanceStats.absent}
                        dot="bg-attendance-absent"
                      />
                      <StatTile
                        label="Late days"
                        value={attendanceStats.late}
                        dot="bg-attendance-late"
                      />
                      <StatTile
                        label="Attendance rate"
                        value={`${attendanceRate}%`}
                        dot="bg-primary"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fees" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Fee management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studentClassesForStudent.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Student is not enrolled in any classes.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {studentClassesForStudent.map((sc) => {
                            const classInfo = classes.find(
                              (c) => c.id === sc.classId,
                            );
                            const fee = fees.find(
                              (f) => f.classId === sc.classId,
                            );
                            const isPaid =
                              fee && parseFloat(fee.feePaid || "0") > 0;
                            return (
                              <div
                                key={sc.id}
                                className="rounded-xl border bg-card p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="truncate text-sm font-semibold sm:text-base">
                                        {classInfo?.name || "Unknown Class"}
                                      </h4>
                                      {fee && (
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "shrink-0",
                                            isPaid
                                              ? "border-attendance-present/30 bg-attendance-present/10 text-attendance-present"
                                              : "border-attendance-absent/30 bg-attendance-absent/10 text-attendance-absent",
                                          )}
                                        >
                                          {isPaid ? "Paid" : "Pending"}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                      {classInfo?.teacher || "Unknown Teacher"}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditFee(fee ?? null)}
                                    disabled={!fee}
                                    className="cursor-pointer w-full sm:w-auto"
                                  >
                                    <Edit className="h-4 w-4" />
                                    {fee ? "Edit fee" : "Add fee"}
                                  </Button>
                                </div>

                                {fee && (
                                  <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3">
                                    <InfoField label="Fee">
                                      <span className="tabular-nums">
                                        {fee.feeToBePaid} ؋
                                      </span>
                                    </InfoField>
                                    <InfoField label="Paid">
                                      <span className="tabular-nums">
                                        {fee.feePaid || "0"} ؋
                                      </span>
                                    </InfoField>
                                    <InfoField label="Unpaid">
                                      <span className="tabular-nums">
                                        {fee.feeUnpaid || "0"} ؋
                                      </span>
                                    </InfoField>
                                    <p className="col-span-3 text-xs text-muted-foreground">
                                      Created{" "}
                                      {fee.createdAt.toLocaleDateString()}
                                      {fee.paymentDate &&
                                        ` · Paid ${fee.paymentDate.toLocaleDateString()}`}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      )}

      <EditFeeModal
        fee={selectedFee}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleFeeUpdateSuccess}
      />
      {/* Image Viewer Modal */}
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="sm:max-w-[600px] max-w-[430px] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-center">
              {student.name} - Profile Picture
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[70vh]">
            <Image
              src={getStudentAvatarSrc(student.avatar, student.gender) || ""}
              alt={`${student.name} avatar`}
              fill
              className="object-contain rounded-b-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
