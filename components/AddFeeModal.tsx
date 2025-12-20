"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { insertFeeSchema } from "@/lib/schema";
import { toast } from "sonner";
import type { InsertFee } from "@/lib/schema";
import { useQueryClient } from "@tanstack/react-query";
import { humanizeError } from "@/lib/humanizeError";
import { Loader2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import type { Student, Class, StudentClass } from "@/lib/schema";

interface AddFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddFeeModal({
  isOpen,
  onClose,
  onSuccess,
}: AddFeeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentOpen, setStudentOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: studentClasses = [] } = useQuery<StudentClass[]>({
    queryKey: ["/api/student-classes"],
  });

  const form = useForm<InsertFee>({
    resolver: zodResolver(insertFeeSchema),
    defaultValues: {
      studentId: "",
      classId: "",
      feeToBePaid: "",
      feePaid: "",
      feeUnpaid: "",
      paymentDate: "",
    },
  });

  const onSubmit = async (data: InsertFee) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/fees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create fee");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/fees"] });

      toast.success("Fee added successfully");

      form.reset();
      setStudentOpen(false);
      setClassOpen(false);
      onClose();
      onSuccess();
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[430px] rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Fee</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel
                    className={
                      form.formState.errors.studentId ? "text-red-500" : ""
                    }
                  >
                    Student *
                  </FormLabel>
                  <ResponsiveDialog
                    open={studentOpen}
                    onOpenChange={setStudentOpen}
                    title="Select Student"
                    trigger={
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={studentOpen}
                          className="w-full justify-between"
                        >
                          {field.value
                            ? students.find(
                                (student) => student.id === field.value
                              )?.name || "Select student..."
                            : "Select student..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    }
                  >
                    <Command className="rounded-lg">
                      <CommandInput
                        placeholder="Search students..."
                        className="h-11 border-0 shadow-none focus:ring-0"
                      />
                      <CommandList className="max-h-64">
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                          No student found.
                        </CommandEmpty>
                        <CommandGroup className="p-2">
                          {students.map((student) => (
                            <CommandItem
                              key={student.id}
                              value={`${student.name} ${student.fatherName}`}
                              onSelect={() => {
                                field.onChange(student.id);
                                form.setValue("classId", "");
                                setStudentOpen(false);
                              }}
                              className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mt-0.5 h-4 w-4 shrink-0",
                                  field.value === student.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col gap-1 min-w-0 flex-1">
                                <span className="font-semibold text-foreground truncate">
                                  {student.name}
                                </span>
                                <span className="text-sm text-muted-foreground truncate">
                                  Father: {student.fatherName}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </ResponsiveDialog>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel
                    className={
                      form.formState.errors.classId ? "text-red-500" : ""
                    }
                  >
                    Class *
                  </FormLabel>
                  <ResponsiveDialog
                    open={classOpen}
                    onOpenChange={setClassOpen}
                    title="Select Class"
                    trigger={
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={classOpen}
                          className="w-full justify-between"
                        >
                          {field.value
                            ? classes.find(
                                (classItem) => classItem.id === field.value
                              )?.name || "Select class..."
                            : "Select class..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    }
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
                                classItem.status === "active" &&
                                (!form.getValues("studentId") ||
                                  studentClasses.some(
                                    (sc) =>
                                      sc.studentId ===
                                        form.getValues("studentId") &&
                                      sc.classId === classItem.id
                                  ))
                            )
                            .map((classItem) => (
                              <CommandItem
                                key={classItem.id}
                                value={`${classItem.name} ${classItem.teacher}`}
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
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </ResponsiveDialog>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feeToBePaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={
                      form.formState.errors.feeToBePaid ? "text-red-500" : ""
                    }
                  >
                    Fee Amount *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter fee amount (؋)"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        // Auto-calculate feeUnpaid when feeToBePaid changes
                        const feePaid = form.getValues("feePaid");
                        const feeToBePaid = e.target.value;
                        if (feeToBePaid && feePaid) {
                          const unpaid = (
                            parseFloat(feeToBePaid) - parseFloat(feePaid)
                          ).toFixed(2);
                          form.setValue("feeUnpaid", unpaid);
                        } else if (feeToBePaid) {
                          form.setValue("feeUnpaid", feeToBePaid);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feePaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={
                      form.formState.errors.feePaid ? "text-red-500" : ""
                    }
                  >
                    Amount Paid *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount paid (؋)"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        // Auto-calculate feeUnpaid when feePaid changes
                        const feeToBePaid = form.getValues("feeToBePaid");
                        const feePaid = e.target.value;
                        if (feeToBePaid && feePaid) {
                          const unpaid = (
                            parseFloat(feeToBePaid) - parseFloat(feePaid)
                          ).toFixed(2);
                          form.setValue("feeUnpaid", unpaid);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feeUnpaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Unpaid (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount unpaid (؋)"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={
                      form.formState.errors.paymentDate ? "text-red-500" : ""
                    }
                  >
                    Payment Date *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isSubmitting ? "Adding..." : "Add Fee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
