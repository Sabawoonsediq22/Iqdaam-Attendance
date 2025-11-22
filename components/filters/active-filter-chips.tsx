"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Types for filtering
interface ClassFilters {
  search: string;
  hour: string;
  month: string;
}

interface ActiveFilterChipsProps {
  filters: ClassFilters;
  onRemoveFilter: (filterKey: keyof ClassFilters) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({
  filters,
  onRemoveFilter,
}: ActiveFilterChipsProps) {
  const activeFilters = useMemo(() => {
    const chips: Array<{ key: keyof ClassFilters; label: string; value: string }> = [];

    if (filters.search) {
      chips.push({ key: 'search', label: 'Search', value: filters.search });
    }

    if (filters.hour && filters.hour !== 'all') {
      const hourLabels: Record<string, string> = {
        morning: 'Morning',
        afternoon: 'Afternoon'
      };
      const label = hourLabels[filters.hour] || filters.hour;
      chips.push({ key: 'hour', label: 'Hour', value: label });
    }

    if (filters.month && filters.month !== 'all') {
      const monthLabels: Record<string, string> = {
        'this-month': 'This Month'
      };
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const label = monthLabels[filters.month] || monthNames[parseInt(filters.month) - 1];
      chips.push({ key: 'month', label: 'Month', value: label });
    }

    return chips;
  }, [filters]);

  if (activeFilters.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">No filters applied</div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">Active filters:</span>
      {activeFilters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="flex items-center gap-1">
          {filter.label}: {filter.value}
          <button
            onClick={() => onRemoveFilter(filter.key)}
            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}