"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudentWithClassSchema } from "@/lib/schema";
import { toast } from "sonner";
import type { InsertStudentWithClass } from "@/lib/schema";
import type { Class } from "@/lib/schema";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { humanizeError } from "@/lib/humanizeError";
import ImageUploader from "./ImageUploader";
import { generateReactHelpers } from "@uploadthing/react";

const { useUploadThing } = generateReactHelpers();
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Check,
  ChevronsUpDown,
  User,
  Clock,
  Calendar,
  Info,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AddStudentModalProps {
  cls?: Class;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export default function AddStudentModal({
  cls,
  onSuccess,
  trigger,
}: AddStudentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { startUpload } = useUploadThing("imageUploader");

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const form = useForm<InsertStudentWithClass>({
    resolver: zodResolver(insertStudentWithClassSchema),
    defaultValues: {
      studentId: "",
      name: "",
      gender: "",
      email: "",
      fatherName: "",
      phone: "",
      avatar: "",
      classId: cls?.id || "",
    },
  });

  const onSubmit = async (data: InsertStudentWithClass) => {
    setIsSubmitting(true);
    try {
      let avatarUrl = data.avatar;

      // Upload image if we have a cropped file
      if (croppedImageFile) {
        const result = await startUpload([croppedImageFile]);
        if (result && result[0] && result[0].url) {
          avatarUrl = result[0].url;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const studentData = { ...data, avatar: avatarUrl };

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create student");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      await queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });

      toast.success("Student added successfully");

      form.reset();
      setCroppedImageFile(null);
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
        {trigger || (
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="cursor-pointer"
          >
            <User className="h-4 w-4 mr-2" />
            Add Student
          </DropdownMenuItem>
        )}
      </DialogTrigger>
      <AnimatePresence>
        {open && (
          <DialogContent className="h-screen">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col lg:flex-row h-screen w-full mx-auto items-center sm:px-10 md:px-22 gap-8 lg:gap-16 sm:my-6"
            >
              <DialogTitle></DialogTitle>
              <div className="flex-1 flex flex-col justify-center space-y-3 w-full">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium leading-none tracking-[-0.03em]">
                  Add Student
                </h2>

                <div className="space-y-4 sm:space-y-6 pt-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <title>Icon</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base text-muted-foreground leading-[150%]">
                        Enter student details such as name, father&apos;s name, gender, and contact information.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <title>Icon</title>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base text-muted-foreground leading-[150%]">
                        Ensure all information is accurate before adding the student.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full border px-4 py-4 sm:px-16 sm:py-6 rounded-lg bg-muted/30 shadow">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Student ID (optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent className="max-w-[200px] sm:max-w-[300px] whitespace-normal word-break">
                              <p>
                                The student ID is an optional unique identifier
                                that can be used for additional student tracking
                                and organization.
                              </p>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <FormControl>
                          <Input
                            placeholder="Enter student ID"
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter student name"
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
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father&apos;s Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter father's name"
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter phone number"
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!cls && (
                    <FormField
                      control={form.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Class *</FormLabel>
                          <Popover open={classOpen} onOpenChange={setClassOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={classOpen}
                                  className="w-full justify-between"
                                >
                                  {field.value
                                    ? classes.find(
                                        (classItem) =>
                                          classItem.id === field.value
                                      )?.name || "Select class..."
                                    : "Select class..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0 shadow-lg border-0"
                              align="start"
                            >
                              <Command className="rounded-lg">
                                <CommandInput
                                  placeholder="Search classes..."
                                  className="h-11 border-0 shadow-none focus:ring-0"
                                />
                                <CommandList className="max-h-64">
                                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                                    No class found.
                                  </CommandEmpty>
                                  <CommandGroup className="p-2">
                                    {classes
                                      .filter(
                                        (classItem) =>
                                          classItem.status === "active"
                                      )
                                      .map((classItem) => (
                                        <CommandItem
                                          key={classItem.id}
                                          value={`${classItem.name} ${classItem.teacher} ${classItem.time}`}
                                          onSelect={() => {
                                            field.onChange(classItem.id);
                                            setClassOpen(false);
                                          }}
                                          className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mt-0.5 h-4 w-4 shrink-0",
                                              field.value === classItem.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col gap-2 min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-foreground truncate">
                                                {classItem.name}
                                              </span>
                                              <span className="text-sm text-muted-foreground shrink-0">
                                                by
                                              </span>
                                              <span className="font-medium text-foreground truncate">
                                                {classItem.teacher}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                              <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{classItem.time}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>
                                                  {new Date(
                                                    classItem.startDate
                                                  ).toLocaleDateString()}
                                                  {classItem.endDate &&
                                                    ` - ${new Date(
                                                      classItem.endDate
                                                    ).toLocaleDateString()}`}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="avatar"
                    render={() => (
                      <FormItem>
                        <FormLabel>Avatar Image (optional)</FormLabel>
                        <FormControl>
                          <ImageUploader
                            mode="deferred"
                            onCrop={(file) => {
                              setCroppedImageFile(file);
                              // Don't set the field value yet - we'll do it during submission
                            }}
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
                      {isSubmitting ? "Adding..." : "Add Student"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
