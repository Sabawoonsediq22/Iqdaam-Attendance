"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Student,
  Class,
  Attendance,
  StudentClass,
  InsertFee,
} from "@/lib/schema";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  CalendarIcon,
  Edit,
  Trash2,
  Coins,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import EditFeeModal from "./EditFeeModal";
import AddFeeModal from "./AddFeeModal";

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
      // Optimistically update the cache by removing the deleted student
      queryClient.setQueryData<Student[]>(["/api/students"], (oldStudents) =>
        oldStudents ? oldStudents.filter((s) => s.id !== student.id) : []
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
        error instanceof Error ? error.message : "Failed to delete student"
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
      <Button onClick={() => setIsOpen(true)} variant="destructive" size="sm">
        <Trash2 />
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

export default function StudentDetailsModal({
  student,
  isOpen,
  onClose,
  onEdit,
  onStudentChange,
}: StudentDetailsModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    startOfMonth(new Date())
  );
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeWithDetails | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFeeDefaults, setAddFeeDefaults] = useState<Partial<InsertFee>>({});

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: studentClasses = [] } = useQuery<StudentClass[]>({
    queryKey: ["/api/student-classes"],
    enabled: !!student?.id && isOpen,
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

  const { data: fees = [] } = useQuery<FeeWithDetails[]>({
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

  const studentClassesForStudent = useMemo(() => {
    return student
      ? studentClasses.filter((sc: StudentClass) => sc.studentId === student.id)
      : [];
  }, [student, studentClasses]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);


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

  const handleEditFee = (fee: FeeWithDetails) => {
    setSelectedFee(fee);
    setIsEditModalOpen(true);
  };

  const handleAddFee = (classId: string) => {
    setAddFeeDefaults({
      studentId: student!.id,
      classId,
    });
    setIsAddModalOpen(true);
  };

  const handleFeeUpdateSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedFee(null);
  };

  const handleFeeAddSuccess = () => {
    setIsAddModalOpen(false);
    setAddFeeDefaults({});
  };

  const attendanceStats = useMemo(() => {
    if (!attendance.length) return { present: 0, absent: 0, late: 0, total: 0 };

    const present = attendance.filter((a) => a.status === "present").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    const late = attendance.filter((a) => a.status === "late").length;

    return { present, absent, late, total: attendance.length };
  }, [attendance]);

  const attendanceOverTime = useMemo(() => {
    const sortedAttendance = [...attendance].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return sortedAttendance.slice(-30).map((a) => ({
      date: new Date(a.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      status: a.status === "present" ? 1 : a.status === "late" ? 0.5 : 0,
      fullStatus: a.status,
    }));
  }, [attendance]);

  const attendanceByStatus = [
    { name: "Present", value: attendanceStats.present, color: "#00C49F" },
    { name: "Absent", value: attendanceStats.absent, color: "#FF8042" },
    { name: "Late", value: attendanceStats.late, color: "#FFBB28" },
  ];

  const filteredAttendance = useMemo(() => {
    return selectedClass ? attendance.filter(a => a.classId === selectedClass) : [];
  }, [attendance, selectedClass]);

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
        fullDate: format(date, "MMM dd"),
      };
    });
  }, [filteredAttendance, selectedMonth]);

  if (!student) return null;

  return (
  <>
    {isOpen && (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in-0 slide-in-from-bottom-4 duration-300 animate-out fade-out-0 slide-out-to-bottom-4">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => student.avatar && setShowImageViewer(true)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            disabled={!student.avatar}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={student.avatar || undefined}
                alt={student.name}
              />
              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
            </Avatar>
          </button>
          <div>
            <p className="font-bold text-lg">{student.name}</p>
            <p className="text-sm text-muted-foreground">Student Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              onClick={() => {
                onClose();
                onEdit();
              }}
              variant="outline"
              size="sm"
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
          <Button onClick={onClose} variant="ghost" size="sm" className="cursor-pointer">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start sm:justify-center sm:gap-2 gap-1 px-4 py-8 border-b border-gray-200 bg-white flex">
          <TabsTrigger value="details" className="text-xs sm:text-sm whitespace-nowrap rounded-3xl border data-[state=active]:border-blue-200 data-[state=active]:text-blue-700 data-[state=active]:bg-blue-100 cursor-pointer">Details</TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs sm:text-sm whitespace-nowrap rounded-3xl border data-[state=active]:border-blue-200 data-[state=active]:text-blue-700 data-[state=active]:bg-blue-100 cursor-pointer">Attendance</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs sm:text-sm whitespace-nowrap rounded-3xl border data-[state=active]:border-blue-200 data-[state=active]:text-blue-700 data-[state=active]:bg-blue-100 cursor-pointer">Analytics</TabsTrigger>
          <TabsTrigger value="fees" className="text-xs sm:text-sm whitespace-nowrap rounded-3xl border data-[state=active]:border-blue-200 data-[state=active]:text-blue-700 data-[state=active]:bg-blue-100 cursor-pointer">Fees</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <TabsContent value="details" className="space-y-6 mt-0">
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
                      <p className="text-sm font-medium text-muted-foreground">
                        Full Name
                      </p>
                      <p className="font-semibold">{student.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Father&apos;s Name
                      </p>
                      <p className="font-semibold">{student.fatherName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Gender
                      </p>
                      <p className="font-semibold">{student.gender}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Class
                      </p>
                      <p className="font-semibold">
                        {studentClassesForStudent.length > 0
                          ? studentClassesForStudent
                              .map((sc) => getClassName(sc.classId))
                              .join(", ")
                          : "No classes assigned"}
                      </p>
                    </div>
                  </div>

                  {student.studentId && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Student ID
                        </p>
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
                        <p className="text-sm font-medium text-muted-foreground">
                          Email
                        </p>
                        <p className="font-semibold">{student.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Phone
                      </p>
                      <p className="font-semibold">
                        {student.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
<TabsContent value="monthly" className="space-y-6 mt-0">

            {/* Date Picker */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Month and Class
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Select Month
                      </label>
                      <Input
                        type="month"
                        value={format(selectedMonth, "yyyy-MM")}
                        onChange={(e) => {
                          const date = new Date(e.target.value + "-01");
                          if (!isNaN(date.getTime())) {
                            setSelectedMonth(date);
                          }
                        }}
                        className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Select Class
                      </label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                  <div className="flex flex-col gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">
                      Selected Filters: {format(selectedMonth, "MMMM yyyy")}
                      {selectedClass && ` | ${getClassName(selectedClass)}`}
                    </p>
                    <p className="text-xs text-blue-700">
                      Choose both month and class to view attendance records
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Attendance Grid */}
            {selectedClass && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Attendance for {getClassName(selectedClass)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                    {monthlyAttendance.map((day) => (
                      <div
                        key={day.dateStr}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          day.status === "present"
                            ? "border-green-500 bg-green-50"
                            : day.status === "absent"
                            ? "border-red-500 bg-red-50"
                            : day.status === "late"
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="text-center">
                          <p className="font-semibold text-sm">{day.dayName}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {day.fullDate}
                          </p>
                          <div className="flex justify-center">
                            {day.status ? (
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  day.status === "present"
                                    ? "bg-green-500"
                                    : day.status === "absent"
                                    ? "bg-red-500"
                                    : "bg-amber-500"
                                }`}
                              >
                                {day.status === "present" ? (
                                  <CheckCircle className="h-4 w-4 text-white" />
                                ) : day.status === "absent" ? (
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
            )}
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6 mt-0">
            {/* Attendance Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {attendanceStats.present}
                    </p>
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
                    <p className="text-2xl font-bold text-red-600">
                      {attendanceStats.absent}
                    </p>
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
                    <p className="text-2xl font-bold text-yellow-600">
                      {attendanceStats.late}
                    </p>
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
                      <YAxis
                        domain={[0, 1]}
                        tickFormatter={(value) =>
                          value === 1
                            ? "Present"
                            : value === 0.5
                            ? "Late"
                            : "Absent"
                        }
                      />
                      <Tooltip
                        formatter={(value: number) => {
                          if (value === 1) return ["Present", "Status"];
                          if (value === 0.5) return ["Late", "Status"];
                          return ["Absent", "Status"];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="status"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
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
                    <ResponsiveContainer
                      width="100%"
                      height={250}
                      className="lg:w-2/3"
                    >
                      <PieChart>
                        <Pie
                          data={attendanceByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) =>
                            percent > 5 ? `${(percent * 100).toFixed(0)}%` : ""
                          }
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {attendanceByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} days`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-3 lg:w-1/3">
                      {attendanceByStatus.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-3"
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.value} days
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fees" className="space-y-6 mt-0">
            {/* Fee Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Fee Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentClassesForStudent.length === 0 ? (
                  <p className="text-muted-foreground">
                    Student is not enrolled in any classes.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {studentClassesForStudent.map((sc) => {
                      const classInfo = classes.find(
                        (c) => c.id === sc.classId
                      );
                      const fee = fees.find((f) => f.classId === sc.classId);
                      return (
                        <div
                          key={sc.id}
                          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex-1 space-y-1 min-w-0">
                            {fee && (
                              <Badge
                                variant={
                                  parseFloat(fee.feePaid || "0") > 0
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {parseFloat(fee.feePaid || "0") > 0
                                  ? "Paid"
                                  : "Pending"}
                              </Badge>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <h4 className="font-semibold text-sm sm:text-base">
                                {classInfo?.name || "Unknown Class"}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {classInfo?.teacher || "Unknown Teacher"}
                              </Badge>
                            </div>
                            {fee ? (
                              <>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>
                                    Fee: {fee.feeToBePaid}؋ | Paid:{" "}
                                    {fee.feePaid || "0"}؋ | Unpaid:{" "}
                                    {fee.feeUnpaid || "0"}؋
                                  </p>
                                  <p className="text-xs">
                                    Created:{" "}
                                    {fee.createdAt.toLocaleDateString()}
                                    {fee.paymentDate &&
                                      ` | Paid: ${fee.paymentDate.toLocaleDateString()}`}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No fee set for this class.
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                fee
                                  ? handleEditFee(fee)
                                  : handleAddFee(sc.classId)
                              }
                              className="cursor-pointer w-full sm:w-auto"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              {fee ? "Edit Fee" : "Add Fee"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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

      <AddFeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleFeeAddSuccess}
        defaultValues={addFeeDefaults}
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
              src={student.avatar || ""}
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
