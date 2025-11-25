"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { insertStudentSchema } from "@/lib/schema";
import { toast } from "sonner";
import type { Student, InsertStudent, Class } from "@/lib/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { humanizeError } from "@/lib/humanizeError";
import ImageUploader from "./ImageUploader";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Clock, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditStudentModal({ student, isOpen, onClose, onSuccess }: EditStudentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      studentId: "",
      name: "",
      gender: "",
      email: "",
      fatherName: "",
      phone: "",
      avatar: "",
      classId: "",
    },
  });

  // Update form when student changes
  useEffect(() => {
    if (student) {
      form.reset({
        studentId: student.studentId || "",
        name: student.name,
        gender: student.gender,
        email: student.email || "",
        fatherName: student.fatherName,
        phone: student.phone || "",
        avatar: student.avatar || "",
        classId: student.classId,
      });
      setCapturedFile(null); // Reset captured file when student changes
    }
  }, [student, form]);

  const onSubmit = async (data: InsertStudent) => {
    if (!student) return;

    setIsSubmitting(true);
    try {
      let avatarUrl = data.avatar;

      // If there's an existing avatar and a new file is captured, delete the old one
      if (student.avatar && capturedFile) {
        try {
          const urlParts = student.avatar.split('/');
          const fileKey = urlParts[urlParts.length - 1];
          if (fileKey) {
            const deleteResponse = await fetch("/api/delete-avatar", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ fileKey }),
            });
            if (deleteResponse.ok) {
              console.log(`Deleted old avatar file: ${fileKey}`);
            } else {
              console.error("Failed to delete old avatar");
            }
          }
        } catch (error) {
          console.error("Failed to delete old avatar:", error);
          // Continue with upload
        }
      }

      // If there's a captured file, upload it
      if (capturedFile) {
        try {
          const formData = new FormData();
          formData.append("file", capturedFile);
          const uploadResponse = await fetch("/api/upload-avatar", {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || "Failed to upload avatar");
          }
          const uploadData = await uploadResponse.json();
          avatarUrl = uploadData.url;
        } catch (error) {
          console.error("Failed to upload new avatar:", error);
          throw new Error("Failed to upload avatar");
        }
      }

      const updateData = { ...data, avatar: avatarUrl };

      const response = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update student");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });

      toast.success("Student updated successfully");

      onClose();
      onSuccess();
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[430px] rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter student ID" {...field} value={field.value || ""} />
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
                    <Input placeholder="Enter student name" {...field} value={field.value || ""} />
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
                    <Input placeholder="Enter father's name" {...field} value={field.value || ""} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                    <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
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
                    <Input type="email" placeholder="Enter email" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                            ? classes.find((classItem) => classItem.id === field.value)?.name || "Select class..."
                            : "Select class..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 shadow-lg border-0" align="start">
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
                            {classes.map((classItem) => (
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
                                    field.value === classItem.id ? "opacity-100" : "opacity-0"
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
                                        {new Date(classItem.startDate).toLocaleDateString()}
                                        {classItem.endDate && ` - ${new Date(classItem.endDate).toLocaleDateString()}`}
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

            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar Image (optional)</FormLabel>
                  <FormControl>
                    <ImageUploader
                      mode="deferred"
                      onCrop={(file) => {
                        setCapturedFile(file);
                        const blobUrl = file ? URL.createObjectURL(file) : "";
                        field.onChange(blobUrl);
                      }}
                      onUpload={(url) => {
                        field.onChange(url);
                        if (!url) {
                          setCapturedFile(null);
                        }
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
                onClick={onClose}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSubmitting ? "Updating..." : "Update Student"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}