"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  MoreVertical,
  Info,
  PencilIcon,
  Delete,
  UserCheck,
  Clock,
  Calendar,
  FileText,
  Users,
  WifiOff,
  BookOpenCheck,
  Loader2,
  CheckCircle,
} from "lucide-react";
import type { Class, StudentClass } from "@/lib/schema";
import { Input } from "./ui/input";
import { useState, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassSchema } from "@/lib/schema";
import type { InsertClass } from "@/lib/schema";
import { parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { ClassFilters } from "./filters";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { humanizeError } from "@/lib/humanizeError";
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
    /^(\d{1,2}):(\d{2})\s*(am|pm)?$/,  // HH:MM AM/PM or 24-hour
    /^(\d{1,2})\s*(am|pm)$/,           // H AM/PM
    /^(\d{1,2}):(\d{2})$/,             // HH:MM (24-hour)
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      let hour = parseInt(match[1]);
      const hasMinutes = match[2] !== undefined;
      const ampm = match[3] || match[hasMinutes ? 3 : 2];

      // Convert 12-hour to 24-hour format
      if (ampm) {
        if (ampm === 'am') {
          if (hour === 12) hour = 0; // 12 AM is 0
        } else if (ampm === 'pm') {
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
function ViewDetailsModal({
  cls,
  studentClasses,
}: {
  cls: Class;
  studentClasses: StudentClass[];
}) {
  const [open, setOpen] = useState(false);
  const studentCount = (studentClasses || []).filter(
    (sc) => sc.classId === cls.id
  ).length;

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      >
        <Info className="h-4 w-4 mr-2" />
        View Details
      </DropdownMenuItem>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="Class Details"
        contentClassName="sm:max-w-[600px] max-w-[430px] rounded-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Class Header */}
          <div className="bg-linear-to-r from-primary/10 to-primary/5 rounded-lg p-4 border">
            <h3 className="font-bold text-xl text-primary mb-1">{cls.name}</h3>
          </div>

          {/* Class Information Grid */}
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teacher */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Teacher
                  </p>
                  <p className="font-semibold">{cls.teacher}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Schedule
                  </p>
                  <p className="font-semibold">{cls.time}</p>
                </div>
              </div>

              {/* Start Date */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Start Date
                  </p>
                  <p className="font-semibold">
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
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    End Date
                  </p>
                  <p className="font-semibold">
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
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Enrolled Students
                  </p>
                  <p className="font-semibold">
                    {studentCount} student{studentCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {cls.description && (
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
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
}: {
  cls: Class;
  onSuccess: () => void;
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
      startDate: cls.startDate,
      endDate: cls.endDate || undefined,
      description: cls.description || "",
    },
  });

  const onSubmit = async (data: InsertClass) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/classes/${cls.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update class");
      }

      // Optimistically update the cache
      queryClient.setQueryData<Class[]>(["/api/classes"], (oldClasses) =>
        oldClasses
          ? oldClasses.map((c) => (c.id === cls.id ? { ...c, ...data } : c))
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="cursor-pointer"
        >
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit Class
        </DropdownMenuItem>
      </DialogTrigger>
      <AnimatePresence>
        {open && (
          <DialogContent className="sm:max-w-[600px] max-w-[430px] rounded-lg max-h-[90vh] overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DialogHeader>
                <DialogTitle>Edit Class</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter class name" {...field} />
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
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 9:00 AM - 10:30 AM"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
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
                      <FormItem>
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
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isSubmitting}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="cursor-pointer"
                    >
                      {isSubmitting && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {isSubmitting ? "Updating..." : "Update Class"}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

// Upgrade Class Modal Component
function UpgradeClassModal({
  cls,
  onSuccess,
}: {
  cls: Class;
  onSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPromotionConfirm, setShowPromotionConfirm] = useState(false);
  const [createdClass, setCreatedClass] = useState<Class | null>(null);

  // Generate suggested name for next class
  const generateNextClassName = (currentName: string): string => {
    const match = currentName.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      return currentName.replace(/\d+/, (num + 1).toString());
    }
    return `${currentName} - Next`;
  };

  const form = useForm<InsertClass>({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      name: generateNextClassName(cls.name),
      teacher: cls.teacher,
      time: cls.time,
      startDate: new Date().toISOString().split("T")[0], // Today
      endDate: undefined,
      description: `Next level class following ${cls.name}`,
    },
  });

  const onSubmit = async (data: InsertClass) => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/classes/${cls.id}/upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newClassData: data, createOnly: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create class");
      }

      const result = await response.json();
      setCreatedClass(result.newClass);
      setShowPromotionConfirm(true);
      toast.success(`Created ${result.newClass.name} successfully`);
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setIsCreating(false);
    }
  };

  const handlePromotionConfirm = async () => {
    if (!createdClass) return;

    setIsCreating(true);
    try {
      const response = await fetch(`/api/classes/${cls.id}/upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ promoteToClassId: createdClass.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to promote students");
      }

      toast.success(`Students promoted to ${createdClass.name}`);

      setIsOpen(false);
      setShowPromotionConfirm(false);
      setCreatedClass(null);
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setIsCreating(false);
    }
  };

  const handlePromotionCancel = () => {
    setShowPromotionConfirm(false);
    setCreatedClass(null);
    setIsOpen(false);
    form.reset();
    onSuccess(); // Refresh the list to show the new class
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
        className="cursor-pointer"
      >
        <BookOpenCheck className="h-4 w-4 mr-2" />
        Upgrade Class
      </DropdownMenuItem>
      <ResponsiveDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Create Next Class & Promote Students"
        contentClassName="sm:max-w-[600px] max-w-[430px] rounded-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <BookOpenCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Upgrade Class
              </h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Create a new class for the next level and automatically promote
              all students from <strong>{cls.name}</strong>. The original class
              will remain unchanged for historical attendance records.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter new class name" {...field} />
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
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 9:00 AM - 10:30 AM"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
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
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isCreating}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="cursor-pointer"
                >
                  {isCreating && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isCreating ? "Creating Class..." : "Create Class"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </ResponsiveDialog>

      {/* Promotion Confirmation Dialog */}
      <ResponsiveDialog
        open={showPromotionConfirm}
        onOpenChange={setShowPromotionConfirm}
        title="Promote Students"
        contentClassName="sm:max-w-[400px] max-w-[350px] rounded-lg"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Promote Students</h3>
            <p className="text-muted-foreground mt-2">
              Would you like to promote all students from{" "}
              <strong>{cls.name}</strong> to the newly created class{" "}
              <strong>{createdClass?.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The original class will remain unchanged for historical attendance
              records.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePromotionCancel}
              disabled={isCreating}
              className="cursor-pointer"
            >
              Skip Promotion
            </Button>
            <Button
              type="button"
              onClick={handlePromotionConfirm}
              disabled={isCreating}
              className="cursor-pointer"
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isCreating ? "Promoting..." : "Promote Students"}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}

// Delete Class Modal Component
function DeleteClassModal({
  cls,
  onSuccess,
}: {
  cls: Class;
  onSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/classes/${cls.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete class");
      }

      // Optimistically update the cache by removing the deleted class
      queryClient.setQueryData<Class[]>(["/api/classes"], (oldClasses) =>
        oldClasses ? oldClasses.filter((c) => c.id !== cls.id) : []
      );

      // Invalidate notifications
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });

      toast.success("Class deleted successfully");

      setIsOpen(false);
      onSuccess();
    } catch (error) {
      // Invalidate queries on error to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast.error(humanizeError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
        className="cursor-pointer text-destructive"
      >
        <Delete className="h-4 w-4 mr-2" />
        Delete Class
      </DropdownMenuItem>
      <DeleteConfirmationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Delete Class"
        description={`Are you sure you want to delete ${cls.name}? This action cannot be undone and will also remove all attendance records for this class.`}
        isDeleting={isDeleting}
      />
    </>
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
}: {
  cls: Class;
  studentClasses: StudentClass[];
  onClassChange: () => void;
}) {
  const router = useRouter();
  const studentCount = (studentClasses || []).filter(
    (sc) => sc.classId === cls.id
  ).length;

  const isCompleted = cls.status === "completed";
  const isUpgraded = cls.status === "upgraded";

  const handleTakeAttendance = () => {
    if (isCompleted || isUpgraded) return;
    router.push(`/attendance?classId=${cls.id}`);
  };

  return (
    <Card
      className={`relative overflow-hidden border-2 shadow-lg bg-linear-to-br from-card via-card/95 to-card/90 hover:shadow-xl group ${
        isUpgraded
          ? "border-blue-500/50"
          : isCompleted
          ? "border-green-500/50"
          : ""
      }`}
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/10 opacity-0" />

      {/* Beautiful light background header */}
      <div className="bg-linear-to-r from-primary/5 via-primary/8 to-primary/5 border-b border-primary/10">
        <CardHeader className="relative pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-sm">
                <BookOpenCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg bg-linear-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {cls.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary/50">
                    <Users className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
                  >
                    {studentCount} student{studentCount !== 1 ? "s" : ""}
                  </Badge>
                  {isUpgraded ? (
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 border-blue-300"
                    >
                      Upgraded
                    </Badge>
                  ) : isCompleted ? (
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-green-100 text-green-800 border-green-300"
                    >
                      Completed
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  className="cursor-pointer rounded-full"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <ViewDetailsModal cls={cls} studentClasses={studentClasses} />
                  {!isUpgraded && (
                    <EditClassModal cls={cls} onSuccess={onClassChange} />
                  )}
                  {!isUpgraded && (
                    <AddStudentModal cls={cls} onSuccess={onClassChange} />
                  )}
                  {isCompleted && !isUpgraded && (
                    <UpgradeClassModal cls={cls} onSuccess={onClassChange} />
                  )}
                  <DeleteClassModal cls={cls} onSuccess={onClassChange} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardTitle>
        </CardHeader>
      </div>

      <CardContent className="space-y-2 mt-3 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 px-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Teacher
              </p>
              <p className="font-semibold text-sm truncate">{cls.teacher}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Schedule
              </p>
              <p className="font-semibold text-sm truncate">{cls.time}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/40">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Duration
            </p>
            <p className="font-semibold text-sm">
              {new Date(cls.startDate).toLocaleDateString()}
              {cls.endDate &&
                ` - ${new Date(cls.endDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="default"
            size="sm"
            className="w-full h-10 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={handleTakeAttendance}
            disabled={isCompleted || isUpgraded}
          >
            <CheckCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            {isCompleted || isUpgraded
              ? "Attendance Disabled"
              : "Take Attendance"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ isOffline = false }: { isOffline?: boolean }) {
  if (isOffline) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium">No Internet Connection</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load classes. Please check your internet connection and
              try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No classes yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first class.
          </p>
        </div>
      </CardContent>
    </Card>
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

  const { filters, setFilters, filteredClasses } = useClassFilters(classes);
  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-6">
      <OfflineIndicator />
      <ClassFilters
        filters={filters}
        onFiltersChange={setFilters}
        classes={classes}
        onAddClass={handleClassAdded}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classesLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader text="Loading classes..." />
          </div>
        ) : (
          <>
            {filteredClasses.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                studentClasses={studentClasses}
                onClassChange={handleClassChange}
              />
            ))}
            {filteredClasses.length === 0 && (
              <EmptyState isOffline={isOffline} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
