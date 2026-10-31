"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  Info,
  Loader2,
  User,
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
            <User className="mr-2 h-4 w-4" />
            Add Student
          </DropdownMenuItem>
        )}
      </DialogTrigger>
      {/* Split form dialog: standard width scale (sm:max-w-xl) */}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            >
              <User className="h-4 w-4" />
            </span>
            <span>Add Student</span>
          </DialogTitle>
          <DialogDescription>
            Enter student details such as name, father&apos;s name, gender, and
            contact information.
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="border bg-muted/30 p-4 rounded shadow">
              <div className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Student ID (optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Info
                            aria-label="About student ID"
                            className="h-4 w-4 cursor-pointer text-muted-foreground"
                          />
                        </PopoverTrigger>
                        <PopoverContent className="max-w-[200px] whitespace-normal sm:max-w-[300px]">
                          <p>
                            The student ID is an optional unique identifier that
                            can be used for additional student tracking and
                            organization.
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
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command className="rounded-lg">
                            <CommandInput placeholder="Search classes..." />
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
                                    className="flex cursor-pointer items-start gap-3 rounded-md p-3 transition-colors hover:bg-muted/50"
                                  >
                                    <Check
                                      className={cn(
                                        "mt-0.5 h-4 w-4 shrink-0",
                                        field.value === classItem.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="truncate font-semibold text-foreground">
                                          {classItem.name}
                                        </span>
                                        <span className="shrink-0 text-sm text-muted-foreground">
                                          by
                                        </span>
                                        <span className="truncate font-medium text-foreground">
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
                {isSubmitting ? "Adding..." : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
