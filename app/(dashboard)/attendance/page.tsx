"use client";

import { useState, useEffect, Suspense } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AttendanceBadge } from "@/components/attendance-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Save,
  Loader2,
  User,
} from "lucide-react";
import type { Class, Student, Attendance } from "@/lib/schema";
import AttendanceClassSelector from "@/components/AttendanceClassSelector";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import EditStudentModal from "@/components/EditStudentModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Loader } from "@/components/loader";
import OfflineIndicator from "@/components/OfflineIndicator";
import { isAfter, startOfDay, format } from "date-fns";
import AddStudentModal from "@/components/AddStudentModal";

function AttendancePageContent() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [localAttendance, setLocalAttendance] = useState<
    Record<string, "present" | "absent" | "late">
  >({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Auto-select class from URL parameter
  useEffect(() => {
    const classIdFromUrl = searchParams.get("classId");
    if (classIdFromUrl && classes.length > 0) {
      const classExists = classes.find((cls) => cls.id === classIdFromUrl);
      if (classExists) {
        setSelectedClass(classIdFromUrl);
      }
    }
  }, [searchParams, classes]);

  const { data: students = [], isLoading: isStudentsLoading } = useQuery<
    Student[]
  >({
    queryKey: ["/api/students", { classId: selectedClass }],
    queryFn: async () => {
      if (!selectedClass) return [];
      const res = await fetch(`/api/students?classId=${selectedClass}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!selectedClass,
  });

  // Derive dropdown values from selected date
  const derivedDay = selectedDate
    ? [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][new Date(selectedDate).getDay()]
    : null;

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: [
      "/api/attendance",
      {
        classId: selectedClass,
        date: selectedDate,
      },
    ],
    queryFn: async () => {
      if (!selectedClass || !selectedDate) return [];
      const res = await fetch(
        `/api/attendance?classId=${selectedClass}&date=${selectedDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!selectedClass && !!selectedDate,
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (
      attendanceData: Array<{
        studentId: string;
        classId: string;
        date: string;
        status: string;
      }>
    ) => {
      const response = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save attendance");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });
      setLocalAttendance({});

      toast.success(
        isAttendanceAlreadyTaken
          ? "Attendance records have been updated successfully"
          : "Attendance records have been saved successfully"
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save attendance records");
    },
  });

  const isSavingAttendance = saveAttendanceMutation.isPending;

  const handleStatusChange = (
    studentId: string,
    status: "present" | "absent" | "late"
  ) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleBulkStatusChange = (status: "present" | "absent" | "late") => {
    const newAttendance: Record<string, "present" | "absent" | "late"> = {};
    students.forEach((student) => {
      newAttendance[student.id] = status;
    });
    setLocalAttendance((prev) => ({
      ...prev,
      ...newAttendance,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;

    // Check if the selected date is in the future
    const selectedDateObj = selectedDate ? new Date(selectedDate) : new Date();
    if (isAfter(startOfDay(selectedDateObj), startOfDay(new Date()))) {
      toast.error("Future Date Not Allowed", {
        description:
          "You cannot take attendance for future dates. Please select today or a past date.",
      });
      return;
    }

    // Check if attendance has already been taken for this date/class
    if (isAttendanceAlreadyTaken && !hasPendingChanges) {
      toast.error("Attendance Already Taken", {
        description:
          "The attendance sheet for this class has already been taken for the selected date.",
      });
      return;
    }

    const attendanceData = Object.entries(localAttendance).map(
      ([studentId, status]) => ({
        studentId,
        classId: selectedClass,
        date: selectedDate,
        status,
      })
    );

    if (attendanceData.length === 0) {
      toast.info("No Changes", {
        description: "No attendance changes to save",
      });
      return;
    }

    await saveAttendanceMutation.mutateAsync(attendanceData);
  };

  const hasPendingChanges = Object.keys(localAttendance).length > 0;
  const isAttendanceAlreadyTaken = attendance.length > 0;
  const isFutureDate = selectedDate
    ? isAfter(startOfDay(new Date(selectedDate)), startOfDay(new Date()))
    : false;

  const getStudentAttendance = (studentId: string) => {
    // First check local changes, then fall back to server data
    if (localAttendance[studentId]) {
      return { status: localAttendance[studentId] } as Attendance;
    }
    return attendance.find((a) => a.studentId === studentId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getBorderClass = (status?: string) => {
    switch (status) {
      case "present":
        return "border-green-500";
      case "absent":
        return "border-red-500";
      case "late":
        return "border-amber-500";
      default:
        return "border-border";
    }
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleEditStudent = () => {
    setIsEditModalOpen(true);
  };

  const confirmDeleteStudent = async () => {
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

      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
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

  const selectedClassData = classes.find((c) => c.id === selectedClass);

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6 sm:px-0">
        <OfflineIndicator />
        <div>
          <p className="text-muted-foreground mt-1">
            Mark student attendance for classes
          </p>
        </div>

        <div className="border rounded-lg p-3 sm:p-4 bg-muted/30 backdrop-blur-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:items-end">
            {/* Class Selector */}
            <div className="flex-1">
              <AttendanceClassSelector
                classes={classes}
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
              />
            </div>

            {/* Date Input */}
            <div className="flex-3">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto h-10"
              />
            </div>
          </div>
        </div>

        {selectedClass && selectedClassData ? (
          <Card>
            <CardHeader>
              <div className="flex sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 shrink-0" />
                    <Tooltip open={isAttendanceAlreadyTaken}>
                      <TooltipTrigger asChild>
                        <span className="truncate">
                          {selectedClassData.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
                        <p className="text-xs font-medium">Attendance Taken</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {derivedDay ? derivedDay + ", " : ""}
                    {selectedDate
                      ? (() => {
                          try {
                            return format(
                              new Date(selectedDate),
                              "MMMM d, yyyy"
                            );
                          } catch {
                            return "Invalid date";
                          }
                        })()
                      : "Select a date"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {students.length} students
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 cursor-pointer p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusChange("present")}
                        className="cursor-pointer"
                      >
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Present
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusChange("late")}
                        className="cursor-pointer"
                      >
                        <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                        Late
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkStatusChange("absent")}
                        className="cursor-pointer"
                      >
                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                        Absent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isStudentsLoading ? (
                <div className="text-center py-12">
                  <Loader size="md" text="Loading students..." />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <p className="text-muted-foreground text-lg">
                    No students found in this class
                  </p>
                  <p className="text-muted-foreground/70 text-sm mt-2">
                    Add students to this class to start taking attendance
                  </p>
                  <AddStudentModal
                    cls={selectedClassData}
                    onSuccess={() => {
                      queryClient.invalidateQueries({
                        queryKey: ["/api/classes"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["/api/students"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["/api/attendance"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["/api/notifications"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["/api/notifications/unread"],
                      });
                    }}
                    trigger={
                      <Button variant="default" className="mt-4 cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {students.map((student) => {
                    const studentAttendance = getStudentAttendance(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg sm:rounded-xl hover:shadow-md sm:hover:shadow-lg transition-all duration-200 bg-card hover:bg-card/50 ${getBorderClass(
                          studentAttendance?.status
                        )}`}
                      >
                        {/* Student Avatar */}
                        <Avatar
                          className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 ring-2 ring-muted shrink-0 cursor-pointer hover:ring-primary/50 transition-colors"
                          onClick={() => handleStudentClick(student)}
                        >
                          <AvatarImage
                            src={student.avatar || undefined}
                            alt={student.name}
                          />
                          <AvatarFallback className="text-sm sm:text-base font-semibold bg-primary/10 text-primary">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Student Information */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-sm sm:text-base md:text-lg leading-tight truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleStudentClick(student)}
                          >
                            {student.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed truncate">
                            {student.fatherName}
                          </p>
                          <p className="text-xs text-muted-foreground/80 leading-relaxed truncate">
                            {student.phone || "No phone"}
                          </p>
                        </div>

                        {/* Attendance Status */}
                        <div className="shrink-0 hidden sm:block">
                          {studentAttendance && (
                            <AttendanceBadge
                              status={
                                studentAttendance.status as
                                  | "present"
                                  | "absent"
                                  | "late"
                              }
                              compact
                            />
                          )}
                        </div>

                        {/* Attendance Action Buttons */}
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant={
                              studentAttendance?.status === "present"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleStatusChange(student.id, "present")
                            }
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:scale-105 transition-transform"
                            title="Mark Present"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              studentAttendance?.status === "late"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleStatusChange(student.id, "late")
                            }
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:scale-105 transition-transform"
                            title="Mark Late"
                          >
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              studentAttendance?.status === "absent"
                                ? "destructive"
                                : "outline"
                            }
                            onClick={() =>
                              handleStatusChange(student.id, "absent")
                            }
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:scale-105 transition-transform"
                            title="Mark Absent"
                          >
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>

            {/* Save Attendance Button */}
            <div className="flex justify-center items-center py-6 border-t">
              <Button
                onClick={handleSaveAttendance}
                disabled={
                  !hasPendingChanges || isSavingAttendance || isFutureDate
                }
                className="px-8 py-2 cursor-pointer hover:scale-105 transition-transform"
                size="lg"
              >
                {isSavingAttendance ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isFutureDate
                  ? "Future Date Not Allowed"
                  : isSavingAttendance
                  ? "Saving..."
                  : hasPendingChanges
                  ? isAttendanceAlreadyTaken
                    ? "Update Attendance"
                    : "Save Attendance"
                  : "All Changes Saved"}
              </Button>
            </div>
          </Card>
        ) : selectedClass ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader size="md" text="Loading attendance data..." />
            </CardContent>
          </Card>
        ) : null}

        <StudentDetailsModal
          student={selectedStudent}
          isOpen={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
          onEdit={handleEditStudent}
          onStudentChange={() => {
            setIsStudentModalOpen(false);
            setSelectedStudent(null);
          }}
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
          onConfirm={confirmDeleteStudent}
          title="Delete Student"
          description={`Are you sure you want to delete ${selectedStudent?.name}? This action cannot be undone and will also remove all attendance records for this student.`}
          isDeleting={isDeleting}
        />
      </div>
    </TooltipProvider>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<Loader size="md" text="Loading..." />}>
      <AttendancePageContent />
    </Suspense>
  );
}
