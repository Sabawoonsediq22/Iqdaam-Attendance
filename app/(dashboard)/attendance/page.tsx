"use client";

import { useState, useEffect, Suspense } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttendanceBadge } from "@/components/attendance-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, XCircle, Clock, MoreVertical, Save, Loader2 } from "lucide-react";
import type { Class, Student, Attendance } from "@/lib/schema";
import AttendanceClassSelector from "@/components/AttendanceClassSelector";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import EditStudentModal from "@/components/EditStudentModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { CalendarIcon } from "lucide-react";
import { format, isAfter, startOfDay, subWeeks } from "date-fns";

function AttendancePageContent() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [localAttendance, setLocalAttendance] = useState<Record<string, "present" | "absent" | "late">>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize with today's date
  useState(() => {
    const today = new Date();
    setSelectedDay(today.toLocaleDateString('en-US', { weekday: 'long' }));
    setSelectedMonth(today.toLocaleDateString('en-US', { month: 'long' }));
    setSelectedYear(today.getFullYear().toString());
  });

  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Auto-select class from URL parameter
  useEffect(() => {
    const classIdFromUrl = searchParams.get('classId');
    if (classIdFromUrl && classes.length > 0) {
      const classExists = classes.find(cls => cls.id === classIdFromUrl);
      if (classExists) {
        setSelectedClass(classIdFromUrl);
      }
    }
  }, [searchParams, classes]);

  const { data: students = [], isLoading: isStudentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students", { classId: selectedClass }],
    queryFn: async () => {
      if (!selectedClass) return [];
      const res = await fetch(`/api/students?classId=${selectedClass}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!selectedClass,
  });

  // Derive dropdown values from calendar date
  const derivedDay = calendarDate ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][calendarDate.getDay()] : selectedDay;
  const derivedMonth = calendarDate ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][calendarDate.getMonth()] : selectedMonth;
  const derivedYear = calendarDate ? calendarDate.getFullYear().toString() : selectedYear;

  // Derive selectedDate from calendar
  const selectedDate = calendarDate ? calendarDate.toISOString().split('T')[0] : "";

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", { classId: selectedClass, day: derivedDay, month: derivedMonth, year: derivedYear }],
    queryFn: async () => {
      if (!selectedClass || !derivedDay || !derivedMonth || !derivedYear) return [];
      const res = await fetch(`/api/attendance?classId=${selectedClass}&day=${derivedDay}&month=${derivedMonth}&year=${derivedYear}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!selectedClass && !!derivedDay && !!derivedMonth && !!derivedYear,
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: Array<{
      studentId: string;
      classId: string;
      date: string;
      day: string;
      month: string;
      year: string;
      status: string;
    }>) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      setLocalAttendance({});

      toast.success(isAttendanceAlreadyTaken
        ? "Attendance records have been updated successfully"
        : "Attendance records have been saved successfully");
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
    setLocalAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleBulkStatusChange = (status: "present" | "absent" | "late") => {
    const newAttendance: Record<string, "present" | "absent" | "late"> = {};
    students.forEach(student => {
      newAttendance[student.id] = status;
    });
    setLocalAttendance(prev => ({
      ...prev,
      ...newAttendance
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDay || !selectedMonth || !selectedYear) return;

    // Check if the selected date is in the future
    const selectedDateObj = calendarDate || new Date();
    if (isAfter(startOfDay(selectedDateObj), startOfDay(new Date()))) {
      toast.error("Future Date Not Allowed", {
        description: "You cannot take attendance for future dates. Please select today or a past date.",
      });
      return;
    }

    // Check if attendance has already been taken for this date/class
    if (isAttendanceAlreadyTaken && !hasPendingChanges) {
      toast.error("Attendance Already Taken", {
        description: "The attendance sheet for this class has already been taken for the selected date.",
      });
      return;
    }

    const attendanceData = Object.entries(localAttendance).map(([studentId, status]) => ({
      studentId,
      classId: selectedClass,
      date: selectedDate,
      day: selectedDay,
      month: selectedMonth,
      year: selectedYear,
      status,
    }));

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
  const isFutureDate = calendarDate ? isAfter(startOfDay(calendarDate), startOfDay(new Date())) : false;

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
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });

      toast.success("Student deleted successfully");

      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle dropdown changes to update calendar
  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    if (derivedMonth && derivedYear) {
      // Find the date that matches the new day in current month/year
      const monthIndex = new Date(`${derivedMonth} 1, ${derivedYear}`).getMonth();
      const year = parseInt(derivedYear);
      const firstDayOfMonth = new Date(year, monthIndex, 1);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayOfWeek = dayNames.indexOf(day);
      const daysToAdd = (targetDayOfWeek - firstDayOfMonth.getDay() + 7) % 7;
      const newDate = new Date(year, monthIndex, 1 + daysToAdd);
      setCalendarDate(newDate);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (derivedDay && derivedYear) {
      // Find the date that matches current day in new month/year
      const monthIndex = new Date(`${month} 1, ${derivedYear}`).getMonth();
      const year = parseInt(derivedYear);
      const firstDayOfMonth = new Date(year, monthIndex, 1);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayOfWeek = dayNames.indexOf(derivedDay);
      const daysToAdd = (targetDayOfWeek - firstDayOfMonth.getDay() + 7) % 7;
      const newDate = new Date(year, monthIndex, 1 + daysToAdd);
      setCalendarDate(newDate);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (derivedDay && derivedMonth) {
      // Find the date that matches current day/month in new year
      const monthIndex = new Date(`${derivedMonth} 1, ${year}`).getMonth();
      const yearNum = parseInt(year);
      const firstDayOfMonth = new Date(yearNum, monthIndex, 1);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayOfWeek = dayNames.indexOf(derivedDay);
      const daysToAdd = (targetDayOfWeek - firstDayOfMonth.getDay() + 7) % 7;
      const newDate = new Date(yearNum, monthIndex, 1 + daysToAdd);
      setCalendarDate(newDate);
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

      <div className="border rounded-lg p-3 sm:p-4 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="space-y-4">
          {/* Class Selector - Full width on mobile */}
          <div className="w-full">
            <AttendanceClassSelector
              classes={classes}
              selectedClass={selectedClass}
              onClassChange={setSelectedClass}
            />
          </div>

          {/* Date Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Dropdowns */}
            <div className="space-y-2 sm:col-span-1 lg:col-span-3">
              <label className="text-sm font-medium text-muted-foreground">Day/Month/Year</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={derivedDay}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-ring/50"
                >
                  <option value="">Day</option>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <option key={day} value={day}>{day.slice(0, 3)}</option>
                  ))}
                </select>

                <select
                  value={derivedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-ring/50"
                >
                  <option value="">Month</option>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month) => (
                    <option key={month} value={month}>{month.slice(0, 3)}</option>
                  ))}
                </select>

                <select
                  value={derivedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:border-ring/50"
                >
                  <option value="">Year</option>
                  {Array.from({ length: new Date().getFullYear() - 2020 + 10 }, (_, i) => 2020 + i).map((year) => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calendar */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Calendar</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">
                      {calendarDate ? format(calendarDate, "MMM dd") : "Pick date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 shadow-xl border-2" align="start">
                  <div className="p-3 bg-background rounded-lg">
                    <Calendar
                      mode="single"
                      selected={calendarDate}
                      onSelect={(date) => {
                        setCalendarDate(date);
                        if (date) {
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                          setSelectedDay(dayNames[date.getDay()]);
                          setSelectedMonth(monthNames[date.getMonth()]);
                          setSelectedYear(date.getFullYear().toString());
                        }
                      }}
                      fromDate={subWeeks(new Date(), 4)}
                      toDate={new Date()}
                      disabled={(date) => isAfter(date, startOfDay(new Date()))}
                      initialFocus
                      className="rounded-md border-0 bg-transparent"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4 relative",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "absolute top-0 left-0 right-0 flex items-center justify-between px-2",
                        nav_button: "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-lg transition-all duration-200 border border-transparent hover:border-accent-foreground/20 flex items-center justify-center",
                        nav_button_previous: "",
                        nav_button_next: "",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {selectedClass && selectedClassData ? (
        <Card>
          <CardHeader>
            <div className="flex sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 min-w-0">
                <Users className="h-5 w-5 shrink-0" />
                <Tooltip open={isAttendanceAlreadyTaken}>
                  <TooltipTrigger asChild>
                    <span className="truncate">{selectedClassData.name}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-red-50 text-red-700 border-red-200">
                    <p className="text-xs font-medium">Attendance Taken</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {students.length} students
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 cursor-pointer p-0">
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
                <p className="text-muted-foreground text-lg">No students found in this class</p>
                <p className="text-muted-foreground/70 text-sm mt-2">Add students to this class to start taking attendance</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {students.map((student) => {
                  const studentAttendance = getStudentAttendance(student.id);
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg sm:rounded-xl hover:shadow-md sm:hover:shadow-lg transition-all duration-200 bg-card hover:bg-card/50 ${getBorderClass(studentAttendance?.status)}`}
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
                          {student.phone || 'No phone'}
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
                          onClick={() => handleStatusChange(student.id, "late")}
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
              disabled={!hasPendingChanges || isSavingAttendance || isFutureDate}
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
                ? (isAttendanceAlreadyTaken ? "Update Attendance" : "Save Attendance")
                : "All Changes Saved"
              }
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