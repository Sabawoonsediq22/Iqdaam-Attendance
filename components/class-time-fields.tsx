"use client";

import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Clock3 } from "lucide-react";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TimePicker } from "@/components/ui/time-picker";
import {
  DEFAULT_CLASS_DURATION_MINUTES,
  addMinutes,
  formatDuration,
  formatTime,
  minutesBetween,
  parseTime,
} from "@/lib/time";
import type { InsertClass } from "@/lib/schema";

/**
 * Start Time + End Time fields shared by the Create/Edit Class modals.
 *
 * Smart scheduling behaviour:
 * - Picking a start time automatically suggests an end time (start + the
 *   last known duration, default 1h) so the common case is one interaction.
 * - Changing the start time again shifts a *suggested* end time to preserve
 *   the class duration — but never overwrites an end time the teacher picked
 *   manually (tracked via `manualEndRef`).
 * - The resulting duration is displayed as a subtle chip.
 * - The "end must be later than start" rule lives in the zod schema
 *   (`insertClassSchema`) and is re-checked live via `trigger`, so the error
 *   under the End Time field appears and clears as the times change.
 */
export function ClassTimeFields() {
  const { control, setValue, trigger } = useFormContext<InsertClass>();

  // Subscribe to both time fields so the parent re-renders on every change.
  const watched = useWatch({ control, name: ["time", "endTime"] });
  const timeValue: string = watched?.[0] ?? "";
  const endValue: string = watched?.[1] ?? "";

  /** `true` once the teacher picked (or cleared) the end time themselves. */
  const manualEndRef = useRef(false);
  /** Last suggested/known class length in minutes. */
  const durationRef = useRef(DEFAULT_CLASS_DURATION_MINUTES);
  /** Last observed start-time value (undefined until first effect run). */
  const prevStartRef = useRef<string | undefined>(undefined);

  // ── Smart scheduling ────────────────────────────────────────────────────
  useEffect(() => {
    const startStr = timeValue ?? "";
    const endStr = endValue ?? "";

    // First run: record the initial values without touching the form, so a
    // prefilled Edit form is never modified the moment the modal opens.
    if (prevStartRef.current === undefined) {
      prevStartRef.current = startStr;
      const initialStart = parseTime(startStr);
      const initialEnd = parseTime(endStr);
      if (initialStart && initialEnd) {
        const initialDuration = minutesBetween(initialStart, initialEnd);
        if (initialDuration !== null) {
          durationRef.current = initialDuration;
        }
      }
      return;
    }

    const start = parseTime(startStr);
    const end = parseTime(endStr);
    const startChanged = prevStartRef.current !== startStr;

    if (startChanged) {
      const prevStart = parseTime(prevStartRef.current);

      // Remember how long the previous valid pair was, so moving the start
      // time keeps the same class length when we re-suggest the end time.
      if (prevStart && end) {
        const previousDuration = minutesBetween(prevStart, end);
        if (previousDuration !== null) {
          durationRef.current = previousDuration;
        }
      }

      prevStartRef.current = startStr;

      if (!start) {
        // Start cleared: reset scheduling state and drop any suggestion.
        manualEndRef.current = false;
        if (endStr) setValue("endTime", "");
        return;
      }

      // Never clobber an end time the teacher picked manually.
      if (manualEndRef.current && endStr) return;

      setValue("endTime", formatTime(addMinutes(start, durationRef.current)), {
        shouldDirty: true,
      });
      return;
    }

    // End-only update: keep the remembered duration in sync with manual picks.
    if (start && end) {
      const currentDuration = minutesBetween(start, end);
      if (currentDuration !== null) {
        durationRef.current = currentDuration;
      }
    }
  }, [timeValue, endValue, setValue]);

  // ── Live validation (range + format) for the two time fields only ───────
  const validatedOnceRef = useRef(false);
  useEffect(() => {
    if (!validatedOnceRef.current) {
      // Don't surface "required" errors the moment a modal mounts.
      validatedOnceRef.current = true;
      return;
    }
    if (!timeValue && !endValue) return; // freshly reset/empty form
    void trigger(["time", "endTime"]);
  }, [timeValue, endValue, trigger]);

  // ── Duration chip ───────────────────────────────────────────────────────
  const start = parseTime(timeValue);
  const end = parseTime(endValue);
  const duration = start && end ? minutesBetween(start, end) : null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time *</FormLabel>
              <FormControl>
                <TimePicker
                  ref={field.ref}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select time"
                  disabled={field.disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time (Optional)</FormLabel>
              <FormControl>
                <TimePicker
                  ref={field.ref}
                  value={field.value}
                  onValueChange={(value) => {
                    manualEndRef.current = true;
                    field.onChange(value);
                  }}
                  onClear={() => {
                    manualEndRef.current = false;
                    field.onChange("");
                  }}
                  placeholder="Select end time"
                  disabled={field.disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {duration !== null && (
        <p className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
          <Clock3 aria-hidden className="h-3.5 w-3.5" />
          Duration
          <span className="font-semibold text-foreground">
            {formatDuration(duration)}
          </span>
        </p>
      )}
    </div>
  );
}
