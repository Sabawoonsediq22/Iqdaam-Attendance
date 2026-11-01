"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  MoreVertical,
  Info,
  PencilIcon,
  UserCheck,
  Clock,
  Calendar,
  FileText,
  Users,
  WifiOff,
  BookOpenCheck,
  Loader2,
  CheckCircle,
  User,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Class, Student, StudentClass } from "@/lib/schema";
import { Input } from "./ui/input";
import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { PageHeader } from "@/components/page-header";
import { EmptyState as SharedEmptyState } from "@/components/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassSchema } from "@/lib/schema";
import type { InsertClass } from "@/lib/schema";
import { ACADEMIC_CLASS_NAMES, SKILL_CLASS_NAMES } from "@/lib/class-names";
import { parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { ClassFilters } from "./filters";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { humanizeError } from "@/lib/humanizeError";
import { ClassTimeFields } from "@/components/class-time-fields";
import { formatTimeRange } from "@/lib/time";
import AddStudentModal from "./AddStudentModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { Loader } from "./loader";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import OfflineIndicator from "./OfflineIndicator";
import { toast } from "sonner";

interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isApproved: boolean;
  image?: string;
}

// Types for filtering
interface ClassFilters {
  search: string;
  hour: string;
  month: string;
}

// Utility functions for filtering
const extractHour = (timeString: string): number => {
  if (!timeString) return 0;

  // Normalize the string
  const normalized = timeString.toLowerCase().trim();

  // Try to match various time formats
  const patterns = [
    /^(\d{1,2}):(\d{2})\s*(am|pm)?$/, // HH:MM AM/PM or 24-hour
    /^(\d{1,2})\s*(am|pm)$/, // H AM/PM
    /^(\d{1,2}):(\d{2})$/, // HH:MM (24-hour)
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      let hour = parseInt(match[1]);
      const hasMinutes = match[2] !== undefined;
      const ampm = match[3] || match[hasMinutes ? 3 : 2];

      // Convert 12-hour to 24-hour format
      if (ampm) {
        if (ampm === "am") {
          if (hour === 12) hour = 0; // 12 AM is 0
        } else if (ampm === "pm") {
          if (hour !== 12) hour += 12; // PM hours except 12
        }
      }
      // For 24-hour format without AM/PM, assume it's already in 24-hour format

      return hour;
    }
  }

  return 0; // fallback
};

const getHourRange = (
  hourFilter: string
): { min: number; max: number } | null => {
  switch (hourFilter) {
    case "morning":
      return { min: 6, max: 13 }; // 6 AM to 12:59 PM
    case "afternoon":
      return { min: 13, max: 18 }; // 1 PM to 5:59 PM
    default:
      return null;
  }
};

const getMonthRange = (
  monthFilter: string
): { start: Date; end: Date } | null => {
  const now = new Date();
  switch (monthFilter) {
    case "this-month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    default:
      return null;
  }
};

// View Details Modal Component
function ViewStudentsModal({
  cls,
  studentClasses,
  students,
  inMenu = true,
  onAction,
}: {
  cls: Class;
  studentClasses: StudentClass[];
  students: Student[];
  inMenu?: boolean;
  onAction?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const enrolledStudents = useMemo(() => {
    const filtered = students.filter(student =>
      studentClasses.some(sc => sc.studentId === student.id && sc.classId === cls.id)
    );
    // Deduplicate by student ID to prevent React key errors
    const seen = new Set<string>();
    return filtered.filter(student => {
      if (seen.has(student.id)) return false;
      seen.add(student.id);
      return true;
    });
  }, [students, studentClasses, cls.id]);

  const content = (
    <>
      <Users className="h-4 w-4 mr-2" />
      View Students
    </>
  );

  const trigger = inMenu ? (
    <DropdownMenuItem
      onSelect={(e) => e.preventDefault()}
      onClick={() => {
        setOpen(true);
        onAction?.();
      }}
      className="cursor-pointer"
    >
      {content}
    </DropdownMenuItem>
  ) : (
    <Button
      variant="ghost"
      onClick={() => {
        setOpen(true);
        onAction?.();
      }}
      className="w-full justify-start"
    >
      {content}
    </Button>
  );

  return (
    <>
      {trigger}
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Class Students"
        contentClassName="sm:max-w-2xl"
      >
        <div className="space-y-4">
          {/* Class Header */}
          <div className="rounded-lg border bg-primary/5 p-4">
            <h3 className="text-lg font-semibold text-primary">{cls.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {enrolledStudents.length} student{enrolledStudents.length !== 1 ? "s" : ""} enrolled
            </p>
          </div>

          {/* Students List */}
          {enrolledStudents.length > 0 ? (
            <div className="space-y-3">
              {enrolledStudents.map((student) => (
                <div key={student.id} className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.fatherName}
                    </p>
                    {student.phone && (
                      <p className="text-xs text-muted-foreground">{student.phone}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SharedEmptyState
              bare
              icon={Users}
              title="No students enrolled"
              description="This class currently has no enrolled students."
            />
          )}
        </div>
      </ResponsiveDialog>
    </>
  );
}

function ViewDetailsModal({
  cls,
  studentClasses,
  inMenu = true,
  onAction,
}: {
  cls: Class;
  studentClasses: StudentClass[];
  inMenu?: boolean;
  onAction?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const studentCount = (studentClasses || []).filter(
    (sc) => sc.classId === cls.id
  ).length;

  const content = (
    <>
      <Info className="h-4 w-4 mr-2" />
      View Details
    </>
  );

  const trigger = inMenu ? (
    <DropdownMenuItem
      onSelect={(e) => e.preventDefault()}
      onClick={() => {
        setOpen(true);
        onAction?.();
      }}
      className="cursor-pointer"
    >
      {content}
    </DropdownMenuItem>
  ) : (
    <Button
      variant="ghost"
      onClick={() => {
        setOpen(true);
        onAction?.();
      }}
      className="w-full justify-start"
    >
      {content}
    </Button>
  );

  return (
    <>
      {trigger}
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Class Details"
        contentClassName="sm:max-w-2xl"
      >
        <div className="space-y-4">
          {/* Class Header */}
          <div className="rounded-lg border bg-primary/5 p-4">
            <h3 className="text-lg font-semibold text-primary">{cls.name}</h3>
          </div>

          {/* Class Information Grid */}
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teacher */}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Teacher
                  </p>
                  <p className="text-sm font-semibold">{cls.teacher}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Schedule
                  </p>
                  <p className="text-sm font-semibold">
                    {formatTimeRange(cls.time, cls.endTime)}
                  </p>
                </div>
              </div>

              {/* Start Date */}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Start Date
                  </p>
                  <p className="text-sm font-semibold">
                    {new Date(cls.startDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* End Date */}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    End Date
                  </p>
                  <p className="text-sm font-semibold">
                    {cls.endDate
                      ? new Date(cls.endDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Ongoing Class"}
                  </p>
                </div>
              </div>

              {/* Student Count */}
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Enrolled Students
                  </p>
                  <p className="text-sm font-semibold">
                    {studentCount} student{studentCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {cls.description && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Description
                    </p>
                    <p className="text-sm leading-relaxed">{cls.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}

// Edit Class Modal Component
function EditClassModal({
  cls,
  onSuccess,
  inMenu = true,
  onAction,
}: {
  cls: Class;
  onSuccess: () => void;
  inMenu?: boolean;
  onAction?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InsertClass>({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      name: cls.name,
      teacher: cls.teacher,
      time: cls.time,
      endTime: cls.endTime ?? "",
      startDate: cls.startDate,
      endDate: cls.endDate || undefined,
      description: cls.description || "",
    },
  });

  const onSubmit = async (data: InsertClass) => {
    setIsSubmitting(true);
    try {
      // Store NULL when the end time was cleared (column is nullable).
      const payload: InsertClass = {
        ...data,
        endTime: data.endTime ? data.endTime : null,
      };

      const response = await fetch(`/api/classes/${cls.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update class");
      }

      // Optimistically update the cache
      queryClient.setQueryData<Class[]>(["/api/classes"], (oldClasses) =>
        oldClasses
          ? oldClasses.map((c) => (c.id === cls.id ? { ...c, ...payload } : c))
          : []
      );

      // Invalidate notifications
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });

      toast.success("Class updated successfully");

      setOpen(false);
      onSuccess();
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <>
      <PencilIcon className="h-4 w-4 mr-2" />
      Edit Class
    </>
  );

  const trigger = inMenu ? (
    <DropdownMenuItem
      onSelect={(e) => e.preventDefault()}
      onClick={onAction}
      className="cursor-pointer"
    >
      {content}
    </DropdownMenuItem>
  ) : (
    <Button variant="ghost" className="w-full justify-start" onClick={onAction}>
      {content}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {/* Edit form dialog: standard width scale (sm:max-w-xl) */}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            >
              <PencilIcon className="h-4 w-4" />
            </span>
            <span>Edit Class</span>
          </DialogTitle>
          <DialogDescription>
            Modify class details such as name, teacher, schedule, and dates.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              {/* Form */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class name" />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-[200px] w-full">
                              <SelectGroup>
                                <SelectLabel className="font-semibold">
                                  Academic Series
                                </SelectLabel>
                                {ACADEMIC_CLASS_NAMES.map((className) => (
                                  <SelectItem key={className} value={className}>
                                    {className}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel className="font-semibold mt-2">
                                  Skill Classes
                                </SelectLabel>
                                {SKILL_CLASS_NAMES.map((className) => (
                                  <SelectItem key={className} value={className}>
                                    {className}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="teacher"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter teacher name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Start Time / End Time + duration */}
                <ClassTimeFields />
              <div className="flex flex-col gap-4 sm:flex-row">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter class description (optional)"
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? "Updating..." : "Update Class"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Filtering logic
const useClassFilters = (classes: Class[] | undefined) => {
  const [filters, setFilters] = useState<ClassFilters>({
    search: "",
    hour: "all",
    month: "all",
  });

  const filteredClasses = useMemo(() => {
    const safeClasses = classes || [];
    return safeClasses.filter((cls) => {
      // Search filter (name or teacher)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !cls.name.toLowerCase().includes(searchLower) &&
          !cls.teacher.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Hour filter
      if (filters.hour && filters.hour !== "all") {
        const hourRange = getHourRange(filters.hour);
        if (hourRange) {
          const classHour = extractHour(cls.time);
          if (classHour < hourRange.min || classHour >= hourRange.max) {
            return false;
          }
        } else {
          // Specific hour - now the value is just the hour number as string
          const filterHour = parseInt(filters.hour);
          const classHour = extractHour(cls.time);
          if (classHour !== filterHour) {
            return false;
          }
        }
      }

      // Month filter
      if (filters.month && filters.month !== "all") {
        const monthRange = getMonthRange(filters.month);
        if (monthRange) {
          const classDate = parseISO(cls.startDate);
          if (!isWithinInterval(classDate, monthRange)) {
            return false;
          }
        } else {
          // Specific month
          const classMonth = parseISO(cls.startDate).getMonth() + 1;
          const filterMonth = parseInt(filters.month);
          if (classMonth !== filterMonth) {
            return false;
          }
        }
      }

      return true;
    });
  }, [classes, filters]);

  return { filters, setFilters, filteredClasses };
};

// Class Card Component
function ClassCard({
  cls,
  studentClasses,
  onClassChange,
  isSelected,
  onSelect,
  students,
}: {
  cls: Class;
  studentClasses: StudentClass[];
  onClassChange: () => void;
  isSelected?: boolean;
  onSelect?: (classId: string) => void;
  students: Student[];
}) {
  const router = useRouter();
  const studentCount = (studentClasses || []).filter(
    (sc) => sc.classId === cls.id
  ).length;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  const handleTakeAttendance = () => {
    router.push(`/attendance?classId=${cls.id}`);
  };

  const menuItems = (
    <>
      <ViewDetailsModal
        cls={cls}
        studentClasses={studentClasses}
        inMenu={!isMobile}
      />
      <ViewStudentsModal
        cls={cls}
        studentClasses={studentClasses}
        students={students}
        inMenu={!isMobile}
      />
      <EditClassModal
        cls={cls}
        onSuccess={onClassChange}
        inMenu={!isMobile}
      />
      <AddStudentModal
        cls={cls}
        onSuccess={onClassChange}
        trigger={
          isMobile ? (
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <User className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          ) : undefined
        }
      />
    </>
  );

  return (
    <Card
      className={`relative group ${
        isSelected ? "border-primary ring-2 ring-primary/20" : ""
      }`}
    >
      {/* Selection checkbox */}
      <div className="absolute top-3 right-3 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect?.(cls.id)}
        />
      </div>

      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">{cls.name}</p>
              <div className="mt-1">
                <Badge variant="secondary">
                  {studentCount} student{studentCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMobile ? (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Class actions">
                    <MoreVertical />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[90vh]">
                  <DrawerHeader>
                    <DrawerTitle>Actions</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-2">{menuItems}</div>
                </DrawerContent>
              </Drawer>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Class actions">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {menuItems}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Teacher
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold">{cls.teacher}</p>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Schedule
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold">
              {formatTimeRange(cls.time, cls.endTime)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Duration
          </p>
          <p className="mt-0.5 text-sm font-semibold">
            {new Date(cls.startDate).toLocaleDateString()} -
            {cls.endDate &&
              ` - ${new Date(cls.endDate).toLocaleDateString()}`}
          </p>
        </div>

        <div className="pt-2">
          <Button className="w-full" onClick={handleTakeAttendance}>
            <CheckCircle />
            Take Attendance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component — delegates to the shared EmptyState so the classes
// grid matches every other page (offline keeps its destructive tint + wording).
function EmptyState({ isOffline = false }: { isOffline?: boolean }) {
  if (isOffline) {
    return (
      <div className="col-span-full">
        <SharedEmptyState
          icon={WifiOff}
          title="No Internet Connection"
          description="Unable to load classes. Please check your internet connection and try again."
        />
      </div>
    );
  }

  return (
    <div className="col-span-full">
      <SharedEmptyState
        icon={BookOpen}
        title="No classes yet"
        description="Get started by creating your first class."
      />
    </div>
  );
}

export default function ClassesClient() {
  const router = useRouter();
  const { data: session } = useSession();

  // Redirect teachers to attendance page
  useEffect(() => {
    if ((session?.user as ExtendedUser)?.role === "teacher") {
      router.push("/dashboard/attendance");
    }
  }, [session, router]);

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      // Set initial state - eslint-disable-next-line react-hooks/exhaustive-deps
      setIsOffline(!navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: classes = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      const res = await fetch("/api/classes", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch classes");
      return res.json();
    },
  });

  const { data: studentClasses = [] } = useQuery<StudentClass[]>({
    queryKey: ["/api/student-classes"],
    queryFn: async () => {
      const res = await fetch("/api/student-classes", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch student classes");
      return res.json();
    },
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const res = await fetch("/api/students", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  const { filters, setFilters, filteredClasses } = useClassFilters(classes);
  const queryClient = useQueryClient();

  // Selection handlers
  const handleSelectClass = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClassIds.length === filteredClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(filteredClasses.map(cls => cls.id));
    }
  };

  const handleClassChange = () => {
    // Invalidate and refetch classes and studentClasses data
    queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/student-classes"] });
  };

  const handleClassAdded = () => {
    // Invalidate and refetch classes and studentClasses data
    queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/student-classes"] });
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/classes/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedClassIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete classes");
      }

      // Optimistically update the cache
      queryClient.setQueryData<Class[]>(["/api/classes"], (oldClasses) =>
        oldClasses ? oldClasses.filter((c) => !selectedClassIds.includes(c.id)) : []
      );

      // Invalidate notifications
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });

      toast.success(`Successfully deleted ${selectedClassIds.length} class${selectedClassIds.length > 1 ? "es" : ""}`);
      setSelectedClassIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast.error(humanizeError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <OfflineIndicator />
      <PageHeader description="Create and manage your classes, schedules, and rosters" />
      {/* Bulk delete control bar */}
      {selectedClassIds.length > 0 && (
        <div className="sticky top-0 z-30 rounded-lg border bg-background/95 backdrop-blur">
          <div className="flex flex-col items-center justify-between gap-4 px-4 py-3 sm:flex-row sm:space-y-0">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">
                {selectedClassIds.length} class{selectedClassIds.length > 1 ? "es" : ""} selected
              </p>
              <Button onClick={handleSelectAll} variant="outline" size="sm">
                Select All Classes
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedClassIds([])}
              >
                Clear Selection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteModalOpen(true)}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      <ClassFilters
        filters={filters}
        onFiltersChange={setFilters}
        classes={classes}
        onAddClass={handleClassAdded}
      />

      {/* Main content with select all button (appears when classes are selected) */}
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classesLoading ? (
            <div className="col-span-full py-4">
              <Loader
                variant="skeleton"
                shape="classes"
                className="max-w-none"
              />
            </div>
          ) : (
            <>
              {filteredClasses.map((cls) => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  studentClasses={studentClasses}
                  onClassChange={handleClassChange}
                  isSelected={selectedClassIds.includes(cls.id)}
                  onSelect={handleSelectClass}
                  students={students}
                />
              ))}
              {filteredClasses.length === 0 && (
                <EmptyState isOffline={isOffline} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Bulk delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Classes"
        description="Are you sure you want to delete the selected classes? This action cannot be undone and will also remove all attendance records for these classes."
        itemCount={selectedClassIds.length}
        isDeleting={isDeleting}
      />
    </div>
  );
}
