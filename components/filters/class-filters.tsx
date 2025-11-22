"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./search-input";
import { HourFilter } from "./hour-filter";
import { MonthFilter } from "./month-filter";
import { ActiveFilterChips } from "./active-filter-chips";
import type { Class } from "@/lib/schema";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";
import type { InsertClass } from "@/lib/schema";
import { Plus } from "lucide-react";
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

function AddClassForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
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
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });

      toast.success("Class created successfully");

      form.reset();
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
        <Button variant="default" className="cursor-pointer w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-w-[430px] rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input placeholder="e.g., 9:00 AM - 10:30 AM" {...field} />
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
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting ? "Creating..." : "Create Class"}
              </Button>
            </div>
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
  onAddClass
}: ClassFiltersProps) {
  const updateFilter = useCallback((key: keyof ClassFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      hour: 'all',
      month: 'all'
    });
  }, [onFiltersChange]);

  const removeFilter = useCallback((filterKey: keyof ClassFilters) => {
    const defaultValues: Record<keyof ClassFilters, string> = {
      search: '',
      hour: 'all',
      month: 'all'
    };
    updateFilter(filterKey, defaultValues[filterKey]);
  }, [updateFilter]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 p-4 bg-muted/30 rounded-lg border">

        <SearchInput
          value={filters.search}
          onChange={(value) => updateFilter('search', value)}
          placeholder="Search by class or teacher"
        />

        <div className="flex items-center gap-2">
        <HourFilter
          value={filters.hour}
          onChange={(value) => updateFilter('hour', value)}
          classes={classes}
        />

        <MonthFilter
          value={filters.month}
          onChange={(value) => updateFilter('month', value)}
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