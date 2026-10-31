"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./search-input";
import { HourFilter } from "./hour-filter";
import { MonthFilter } from "./month-filter";
import { ActiveFilterChips } from "./active-filter-chips";
import type { Class } from "@/lib/schema";
import {
  ExpandableScreen,
  ExpandableScreenContent,
  ExpandableScreenTrigger,
  useExpandableScreen,
} from "@/components/ui/expandable-screen";
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
import { Plus, Loader2, Paintbrush } from "lucide-react";
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
  const { collapse } = useExpandableScreen();
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
    if (!inputRef.current) return;
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
  }, [form]);

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
      collapse();
      onSuccess();
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 flex mx-auto flex-col items-center gap-8 p-6 sm:p-10 lg:p-16 lg:gap-16">
      <div className="flex-1 rounded-lg border bg-muted/30 px-4 py-4 sm:px-16 sm:py-6">
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

            <div className="flex gap-2 pb-2">
              <Button
                type="button"
                variant="outline"
                onClick={collapse}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

function AddClassForm({ onSuccess }: { onSuccess: () => void }) {
  return (
    <ExpandableScreen
      layoutId="add-class-screen"
    >
      <ExpandableScreenTrigger>
        <Button variant="default" className="w-full">
          <Plus />
          Add Class
        </Button>
      </ExpandableScreenTrigger>
      <ExpandableScreenContent className="bg-background">
        <AddClassFormContent onSuccess={onSuccess} />
      </ExpandableScreenContent>
    </ExpandableScreen>
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

        <AddClassForm onSuccess={onAddClass} />
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

