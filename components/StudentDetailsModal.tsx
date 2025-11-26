"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Student, Class, Attendance } from "@/lib/schema";
import { User, Mail, Phone, BookOpen, TrendingUp, CheckCircle, XCircle, Clock, CalendarIcon, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, startOfWeek, addDays, subWeeks, addWeeks } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface StudentDetailsModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onStudentChange?: () => void;
}

// Delete Student Modal Component
function DeleteStudentModal({ student, onSuccess }: { student: Student; onSuccess: () => void }) {
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
      // Optimistically update the cache by removing the deleted student
      queryClient.setQueryData<Student[]>(["/api/students"], (oldStudents) =>
        oldStudents ? oldStudents.filter((s) => s.id !== student.id) : []
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });

      toast.success("Student deleted successfully");

      setIsOpen(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete student");
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
      <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setIsOpen(true)} className="cursor-pointer text-destructive">
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Student
      </DropdownMenuItem>
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


export default function StudentDetailsModal({ student, isOpen, onClose, onEdit, onStudentChange }: StudentDetailsModalProps) {
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 6 }));
  const [showImageViewer, setShowImageViewer] = useState(false);

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", student?.id],
    queryFn: async () => {
      if (!student?.id) return [];
      const res = await fetch(`/api/attendance?studentId=${student.id}`);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!student?.id && isOpen,
  });

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

  const attendanceStats = useMemo(() => {
    if (!attendance.length) return { present: 0, absent: 0, late: 0, total: 0 };

    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;

    return { present, absent, late, total: attendance.length };
  }, [attendance]);

  const attendanceOverTime = useMemo(() => {
    const sortedAttendance = [...attendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedAttendance.slice(-30).map(a => ({
      date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: a.status === 'present' ? 1 : a.status === 'late' ? 0.5 : 0,
      fullStatus: a.status
    }));
  }, [attendance]);

  const attendanceByStatus = [
    { name: 'Present', value: attendanceStats.present, color: '#00C49F' },
    { name: 'Absent', value: attendanceStats.absent, color: '#FF8042' },
    { name: 'Late', value: attendanceStats.late, color: '#FFBB28' },
  ];

  const weeklyAttendance = useMemo(() => {
    const weekDays = [];
    for (let i = 0; i < 6; i++) {
      const date = addDays(selectedWeekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = attendance.find(a => a.date === dateStr);
      weekDays.push({
        date,
        dateStr,
        status: record?.status || null,
        dayName: format(date, 'EEE'),
        fullDate: format(date, 'MMM dd'),
      });
    }
    return weekDays;
  }, [attendance, selectedWeekStart]);

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-w-[430px] rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center sm:items-start justify-between gap-4">
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
              <button
                onClick={() => student.avatar && setShowImageViewer(true)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                disabled={!student.avatar}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.avatar || undefined} alt={student.name} />
                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                </Avatar>
              </button>
              <div>
                <p className="font-bold">{student.name}</p>
                <p className="text-sm text-muted-foreground">Student Details</p>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2 mr-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="cursor-pointer rounded-full">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onEdit && (
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => {
                      onClose();
                      onEdit();
                    }} className="cursor-pointer">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Student
                    </DropdownMenuItem>
                  )}
                  <DeleteStudentModal student={student!} onSuccess={() => {
                    onStudentChange?.();
                  }} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="attendance">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                      <p className="font-semibold">{student.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Father&apos;s Name</p>
                      <p className="font-semibold">{student.fatherName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gender</p>
                      <p className="font-semibold">{student.gender}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Class</p>
                      <p className="font-semibold">{getClassName(student.classId)}</p>
                    </div>
                  </div>

                  {student.studentId && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                        <p className="font-semibold">{student.studentId}</p>
                      </div>
                    </div>
                  )}

                  {student.email && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="font-semibold">{student.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="font-semibold">{student.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6">
            {/* Date Picker */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto justify-start text-left font-normal hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedWeekStart, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 shadow-xl border-2" align="start">
                        <div className="p-3 bg-background rounded-lg">
                          <Calendar
                            mode="single"
                            selected={selectedWeekStart}
                            onSelect={(date) => date && setSelectedWeekStart(startOfWeek(date, { weekStartsOn: 6 }))}
                            fromDate={subWeeks(new Date(), 4)}
                            toDate={addWeeks(new Date(), 4)}
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
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">
                        Selected Week: {format(selectedWeekStart, "MMM dd")} - {format(addDays(selectedWeekStart, 5), "MMM dd, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click to change week selection
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Attendance Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {weeklyAttendance.map((day) => (
                    <div
                      key={day.dateStr}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        day.status === 'present'
                          ? 'border-green-500 bg-green-50'
                          : day.status === 'absent'
                          ? 'border-red-500 bg-red-50'
                          : day.status === 'late'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <p className="font-semibold text-sm">{day.dayName}</p>
                        <p className="text-xs text-muted-foreground mb-2">{day.fullDate}</p>
                        <div className="flex justify-center">
                          {day.status ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              day.status === 'present' ? 'bg-green-500' :
                              day.status === 'absent' ? 'bg-red-500' : 'bg-amber-500'
                            }`}>
                              {day.status === 'present' ? (
                                <CheckCircle className="h-4 w-4 text-white" />
                              ) : day.status === 'absent' ? (
                                <XCircle className="h-4 w-4 text-white" />
                              ) : (
                                <Clock className="h-4 w-4 text-white" />
                              )}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
                              <span className="text-xs text-gray-400">-</span>
                            </div>
                          )}
                        </div>
                        {day.status && (
                          <p className="text-xs font-medium mt-1 capitalize text-center">
                            {day.status}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            {/* Attendance Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                    <p className="text-sm text-muted-foreground">Late</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Attendance Trend (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={attendanceOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 1]} tickFormatter={(value) => value === 1 ? 'Present' : value === 0.5 ? 'Late' : 'Absent'} />
                      <Tooltip
                        formatter={(value: number) => {
                          if (value === 1) return ['Present', 'Status'];
                          if (value === 0.5) return ['Late', 'Status'];
                          return ['Absent', 'Status'];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="status"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Attendance Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Attendance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row items-center gap-6">
                    <ResponsiveContainer width="100%" height={250} className="lg:w-2/3">
                      <PieChart>
                        <Pie
                          data={attendanceByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) => percent > 5 ? `${(percent * 100).toFixed(0)}%` : ''}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {attendanceByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} days`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-3 lg:w-1/3">
                      {attendanceByStatus.map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.value} days</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Image Viewer Modal */}
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="sm:max-w-[600px] max-w-[430px] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-center">{student.name} - Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[70vh]">
            <Image
              src={student.avatar || ""}
              alt={`${student.name} avatar`}
              fill
              className="object-contain rounded-b-lg"
            />
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}