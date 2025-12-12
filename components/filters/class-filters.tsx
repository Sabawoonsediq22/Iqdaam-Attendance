"use client";

import { useCallback, useState } from "react";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassSchema } from "@/lib/schema";
import { toast } from "sonner";
import type { InsertClass } from "@/lib/schema";
import { Plus, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { humanizeError } from "@/lib/humanizeError";

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

  const form = useForm<InsertClass>({
    resolver: zodResolver(insertClassSchema),
    defaultValues: {
      name: "",
      teacher: "",
      time: "",
      startDate: "",
      endDate: undefined,
      description: "",
    },
  });

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
    <div className="relative z-10 flex flex-col lg:flex-row h-full w-full max-w-[1100px] mx-auto items-center p-6 sm:p-10 lg:p-16 gap-8 lg:gap-16">
      <div className="flex-1 flex flex-col justify-center space-y-3 w-full">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-primary-foreground leading-none tracking-[-0.03em]">
          Add New Class
        </h2>

        <div className="space-y-4 sm:space-y-6 pt-4">
          <div className="flex gap-3 sm:gap-4">
            <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground"
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
              <p className="text-sm sm:text-base text-primary-foreground leading-[150%]">
                Create a new class to organize your students and track
                attendance efficiently.
              </p>
            </div>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground"
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
              <p className="text-sm sm:text-base text-primary-foreground leading-[150%]">
                Set up class schedules, assign teachers, and manage student
                enrollment.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-5"
          >
            <div>
              <FormLabel className="mb-3 text-white">
                CLASS NAME *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter class name"
                  {...form.register("name")}
                />
              </FormControl>
              <FormMessage />
            </div>

            <div>
              <FormLabel className="mb-3 text-white">
                TEACHER *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter teacher name"
                  {...form.register("teacher")}
                />
              </FormControl>
              <FormMessage />
            </div>

            <div>
              <FormLabel className="mb-3 text-white">
                TIME *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 9:00 AM - 10:30 AM"
                  {...form.register("time")}
                />
              </FormControl>
              <FormMessage />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <FormLabel className="mb-3 text-white">
                  START DATE *
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...form.register("startDate")}
                  />
                </FormControl>
                <FormMessage />
              </div>
              <div className="flex-1">
                <FormLabel className="mb-3 text-white">
                  END DATE (OPTIONAL)
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...form.register("endDate")}
                  />
                </FormControl>
                <FormMessage />
              </div>
            </div>

            <div>
              <FormLabel className="mb-3 text-white">
                DESCRIPTION
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter class description (optional)"
                  rows={3}
                  {...form.register("description")}
                />
              </FormControl>
              <FormMessage />
            </div>

            <div className="flex gap-3 mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={collapse}
                disabled={isSubmitting}
                className="flex-1 px-8 py-2.5 rounded-full bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 transition-colors tracking-[-0.03em] h-10 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-8 py-2.5 rounded-full bg-primary-foreground text-primary font-medium hover:bg-primary-foreground/90 transition-colors tracking-[-0.03em] h-10 cursor-pointer"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
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
      triggerRadius="100px"
      contentRadius="24px"
    >
      <ExpandableScreenTrigger>
        <Button variant="default" className="cursor-pointer w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </ExpandableScreenTrigger>
      <ExpandableScreenContent className="bg-primary">
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
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 p-4 bg-muted/30 rounded-lg border">
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
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Clear All
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
