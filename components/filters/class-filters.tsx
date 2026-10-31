"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./search-input";
import { HourFilter } from "./hour-filter";
import { MonthFilter } from "./month-filter";
import { ActiveFilterChips } from "./active-filter-chips";
import type { Class } from "@/lib/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassSchema } from "@/lib/schema";
import { ACADEMIC_CLASS_NAMES, SKILL_CLASS_NAMES } from "@/lib/class-names";
import { toast } from "sonner";
import type { InsertClass } from "@/lib/schema";
import { BookOpen, FileText, Plus, Loader2, Paintbrush } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { humanizeError } from "@/lib/humanizeError";
import { TimepickerUI } from "timepicker-ui";
import "timepicker-ui/index.css";
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

// Types for filtering
interface ClassFilters {
  search: string;
  hour: string;
  month: string;
}

interface ClassFiltersProps {
  filters: ClassFilters;
  onFiltersChange: (filters: ClassFilters) => void;
  classes: Class[] | undefined;
  onAddClass: () => void;
}

function AddClassFormContent({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedTime, setSelectedTime] = useState("");

  const form = useForm<InsertClass>({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      name: "",
      teacher: "",
      time: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open || !inputRef.current) return;
    const picker = new TimepickerUI(inputRef.current, {
      ui: { theme: "ai" },
      callbacks: {
        onConfirm: (data) => {
          const time = `${data.hour}:${data.minutes}${data.type ? " " + data.type : ""}`;
          setSelectedTime(time);
          form.setValue("time", time);
        },
      },
    });
    picker.create();
    return () => picker.destroy();
  }, [form, open]);

  const onSubmit = async (data: InsertClass) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      };
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create class");
      }

      // Invalidate the cache to refetch classes
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/notifications/unread"],
      });

      toast.success("Class created successfully");

      form.reset();
      setSelectedTime("");
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
        <Button variant="default" className="w-full">
          <Plus />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            >
              <BookOpen className="h-4 w-4" />
            </span>
            <span>Create Class</span>
          </DialogTitle>
          <DialogDescription>
            Enter class details such as name, teacher, schedule, and dates.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr] lg:items-start">
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4 sm:p-6">
                <div className="flex gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                  >
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Add a class by choosing its name and entering the teacher
                    and schedule details.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                  >
                    <FileText className="h-5 w-5" />
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Check the class dates before creating it. The end date and
                    description are optional.
                  </p>
                </div>
              </div>

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
                          value={field.value}
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

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time *</FormLabel>
                      <FormControl>
                        <Input
                          ref={(node) => {
                            inputRef.current = node;
                            field.ref(node);
                          }}
                          type="text"
                          placeholder="Select time"
                          value={selectedTime}
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          rows={3}
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
                {isSubmitting ? "Creating..." : "Create Class"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ClassFilters({
  filters,
  onFiltersChange,
  classes,
  onAddClass,
}: ClassFiltersProps) {
  const updateFilter = useCallback(
    (key: keyof ClassFilters, value: string) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      search: "",
      hour: "all",
      month: "all",
    });
  }, [onFiltersChange]);

  const removeFilter = useCallback(
    (filterKey: keyof ClassFilters) => {
      const defaultValues: Record<keyof ClassFilters, string> = {
        search: "",
        hour: "all",
        month: "all",
      };
      updateFilter(filterKey, defaultValues[filterKey]);
    },
    [updateFilter]
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        <SearchInput
          value={filters.search}
          onChange={(value) => updateFilter("search", value)}
          placeholder="Search by class or teacher"
        />

        <div className="flex items-center gap-2">
          <HourFilter
            value={filters.hour}
            onChange={(value) => updateFilter("hour", value)}
            classes={classes}
          />

          <MonthFilter
            value={filters.month}
            onChange={(value) => updateFilter("month", value)}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <Paintbrush />
            <span className="hidden sm:block">Clear All</span>
          </Button>
        </div>

        <div className="flex-1" />

        <AddClassFormContent onSuccess={onAddClass} />
      </div>

      {/* Active Filter Chips */}
      <ActiveFilterChips
        filters={filters}
        onRemoveFilter={removeFilter}
        onClearAll={clearAllFilters}
      />
    </div>
  );
}
