"use client";

import * as React from "react";
import { Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  formatTime,
  parseTime,
  type TimeOfDay,
} from "@/lib/time";

export type TimePickerProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "value" | "onChange" | "ref"
> & {
  /** Canonical stored value, e.g. `"4:30 PM"`. */
  value?: string | null;
  /** Called with the canonical value whenever a complete time is selected. */
  onValueChange: (value: string) => void;
  /** When provided, a subtle "Clear" action is offered in the popover. */
  onClear?: () => void;
  /** Text shown in the trigger while no time has been picked. */
  placeholder?: string;
  /** Extra classes for the trigger wrapper (layout only). */
  className?: string;
};

type Meridiem = "AM" | "PM";

const TWO_DIGITS = /^\d{1,2}$/;

function parseHourText(text: string): number | null {
  if (!TWO_DIGITS.test(text)) return null;
  const hour = Number(text);
  return hour >= 1 && hour <= 12 ? hour : null;
}

function parseMinuteText(text: string): number | null {
  if (!TWO_DIGITS.test(text)) return null;
  const minute = Number(text);
  return minute >= 0 && minute <= 59 ? minute : null;
}

function digitsOnly(text: string): string {
  return text.replace(/\D/g, "").slice(0, 2);
}

/**
 * Lightweight popover time picker built on the Attendly design system
 * (Input trigger, Popover surface, Button actions).
 *
 * - Type into the hour / minute spinbuttons or nudge them with ↑ / ↓.
 * - Switch AM/PM with a segmented control (← / → also work).
 * - Enter confirms and closes, Escape closes without losing valid edits,
 *   and a "Done" button gives touch users an explicit confirmation.
 * - Values are committed to `onValueChange` as soon as they form a complete,
 *   valid time — so closing the popover never drops a real selection.
 */
export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      value,
      onValueChange,
      onClear,
      placeholder = "Select time",
      disabled,
      className,
      ...inputProps
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [hourText, setHourText] = React.useState("");
    const [minuteText, setMinuteText] = React.useState("");
    const [meridiem, setMeridiem] = React.useState<Meridiem>("AM");
    const minuteInputRef = React.useRef<HTMLInputElement | null>(null);
    // Auto-advance moves focus to the minutes *inside* the hour change handler,
    // so the hour's blur fires synchronously against the not-yet-committed
    // render state. Skip exactly that blur — it must not re-commit/revert.
    const skipNextHourBlurRef = React.useRef(false);

    // Current in-popover draft, or null while the fields are incomplete.
    const draft: TimeOfDay | null = React.useMemo(() => {
      const hour = parseHourText(hourText);
      const minute = parseMinuteText(minuteText);
      if (hour === null || minute === null) return null;
      return { hour, minute, meridiem };
    }, [hourText, minuteText, meridiem]);

    /** Commits the given field texts when they form a complete valid time. */
    const commit = React.useCallback(
      (hour: string, minute: string, mer: Meridiem) => {
        const h = parseHourText(hour);
        const m = parseMinuteText(minute);
        if (h === null || m === null) return false;
        onValueChange(formatTime({ hour: h, minute: m, meridiem: mer }));
        return true;
      },
      [onValueChange]
    );

    const revertToValue = React.useCallback(() => {
      const parsed = parseTime(value);
      if (parsed) {
        setHourText(String(parsed.hour));
        setMinuteText(String(parsed.minute).padStart(2, "0"));
        setMeridiem(parsed.meridiem);
      } else {
        setHourText("");
        setMinuteText("");
      }
    }, [value]);

    const handleOpenChange = React.useCallback(
      (next: boolean) => {
        if (next) {
          skipNextHourBlurRef.current = false;
          // Seed the draft: from the current value, or from "now" when empty.
          const parsed = parseTime(value);
          if (parsed) {
            setHourText(String(parsed.hour));
            setMinuteText(String(parsed.minute).padStart(2, "0"));
            setMeridiem(parsed.meridiem);
          } else {
            const now = new Date();
            const hour24 = now.getHours();
            setHourText(String(hour24 % 12 === 0 ? 12 : hour24 % 12));
            setMinuteText(String(now.getMinutes()).padStart(2, "0"));
            setMeridiem(hour24 < 12 ? "AM" : "PM");
          }
        }
        setOpen(next);
      },
      [value]
    );

    const handleHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const digits = digitsOnly(event.target.value);
      setHourText(digits);

      // "0"/"1" may start a two-digit hour ("05", "12") — wait for the next
      // digit; any other single digit is already a complete hour.
      const isComplete =
        digits.length === 2 || (digits.length === 1 && digits !== "0" && digits !== "1");

      if (isComplete && parseHourText(digits) !== null) {
        // Normalize immediately ("05" -> "5") so the blur handler below
        // (skipped) and any later reads see the canonical text.
        setHourText(String(Number(digits)));
        const minute = parseMinuteText(minuteText);
        if (minute !== null) {
          onValueChange(
            formatTime({ hour: Number(digits), minute, meridiem })
          );
        }
        if (document.activeElement !== minuteInputRef.current) {
          // Flag the imminent synchronous blur so handleHourBlur doesn't run
          // against stale closure state (it would re-commit/revert wrongly).
          skipNextHourBlurRef.current = true;
          minuteInputRef.current?.focus();
        }
      }
    };

    const handleMinuteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const digits = digitsOnly(event.target.value);
      setMinuteText(digits);

      if (digits.length === 2) {
        const minute = parseMinuteText(digits);
        const hour = parseHourText(hourText);
        if (minute !== null && hour !== null) {
          onValueChange(formatTime({ hour, minute, meridiem }));
        }
      }
    };

    const handleHourBlur = () => {
      // Auto-advance triggered this blur synchronously — the value was already
      // committed in handleHourChange against the pre-render state, so skip.
      if (skipNextHourBlurRef.current) {
        skipNextHourBlurRef.current = false;
        return;
      }
      if (parseHourText(hourText) === null) {
        revertToValue();
        return;
      }
      setHourText(String(Number(hourText)));
      commit(hourText, minuteText, meridiem);
    };

    const handleMinuteBlur = () => {
      if (parseMinuteText(minuteText) === null) {
        revertToValue();
        return;
      }
      setMinuteText(minuteText.padStart(2, "0"));
      commit(hourText, minuteText, meridiem);
    };

    const handleSpinKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
      unit: "hour" | "minute"
    ) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      const delta = event.key === "ArrowUp" ? 1 : -1;

      if (unit === "hour") {
        const base =
          parseHourText(hourText) ?? parseTime(value)?.hour ?? 12;
        const next = (((base - 1 + delta) % 12) + 12) % 12 + 1; // wrap 1..12
        const nextText = String(next);
        setHourText(nextText);
        const minute = parseMinuteText(minuteText);
        if (minute !== null) {
          onValueChange(formatTime({ hour: next, minute, meridiem }));
        }
      } else {
        const base =
          parseMinuteText(minuteText) ?? parseTime(value)?.minute ?? 0;
        const next = (((base + delta) % 60) + 60) % 60; // wrap 0..59
        setMinuteText(String(next).padStart(2, "0"));
        const hour = parseHourText(hourText);
        if (hour !== null) {
          onValueChange(formatTime({ hour, minute: next, meridiem }));
        }
      }
    };

    const selectMeridiem = (next: Meridiem) => {
      if (next !== meridiem) setMeridiem(next);
      if (parseMinuteText(minuteText) !== null) {
        setMinuteText(minuteText.padStart(2, "0"));
      }
      commit(hourText, minuteText, next);
    };

    const handleMeridiemKeyDown = (
      event: React.KeyboardEvent<HTMLDivElement>
    ) => {
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        selectMeridiem(meridiem === "AM" ? "PM" : "AM");
      }
    };

    const confirmAndClose = () => {
      commit(hourText, minuteText, meridiem);
      setOpen(false);
    };

    const handleClear = () => {
      onClear?.();
      setOpen(false);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Enter confirms the selection instead of submitting the surrounding form.
      if (event.key === "Enter") {
        event.preventDefault();
        confirmAndClose();
      }
    };

    const preview = draft ? formatTime(draft) : value || "--:--";

    const segmentClassName = (active: boolean) =>
      cn(
        "h-7 flex-1 rounded-[5px] px-2 text-xs font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      );

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <div className={cn("relative", className)}>
          <PopoverTrigger asChild>
            <Input
              ref={ref}
              {...inputProps}
              readOnly
              disabled={disabled}
              value={value ?? ""}
              placeholder={placeholder}
              aria-haspopup="dialog"
              className="cursor-pointer pr-9"
              onKeyDown={(event) => {
                inputProps.onKeyDown?.(event);
                if (event.defaultPrevented) return;
                // Enter/Space/↓ open the picker; Enter must not submit the form.
                if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
                  event.preventDefault();
                  setOpen((isOpen) => !isOpen);
                }
              }}
            />
          </PopoverTrigger>
          <Clock3
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        <PopoverContent
          align="start"
          sideOffset={6}
          aria-label="Time picker"
          className="w-72 p-4"
        >
          <div className="space-y-3">
            {/* Currently selected time */}
            <div
              className="flex items-center justify-center rounded-md border bg-muted/40 px-3 py-2"
              data-testid="time-picker-preview"
            >
              <span className="text-lg font-semibold tabular-nums tracking-tight">
                {preview}
              </span>
            </div>

            {/* Hour : Minute + AM/PM */}
            <div className="flex items-center justify-center gap-2">
              <Input
                value={hourText}
                onChange={handleHourChange}
                onBlur={handleHourBlur}
                onKeyDown={(event) => {
                  handleInputKeyDown(event);
                  handleSpinKeyDown(event, "hour");
                }}
                onFocus={(event) => event.currentTarget.select()}
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                placeholder="--"
                aria-label="Hour"
                role="spinbutton"
                aria-valuemin={1}
                aria-valuemax={12}
                aria-valuenow={parseHourText(hourText) ?? undefined}
                className="h-9 w-16 px-1 text-center font-semibold tabular-nums"
              />
              <span aria-hidden className="text-base font-medium text-muted-foreground">
                :
              </span>
              <Input
                ref={minuteInputRef}
                value={minuteText}
                onChange={handleMinuteChange}
                onBlur={handleMinuteBlur}
                onKeyDown={(event) => {
                  handleInputKeyDown(event);
                  handleSpinKeyDown(event, "minute");
                }}
                onFocus={(event) => event.currentTarget.select()}
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                placeholder="--"
                aria-label="Minute"
                role="spinbutton"
                aria-valuemin={0}
                aria-valuemax={59}
                aria-valuenow={parseMinuteText(minuteText) ?? undefined}
                className="h-9 w-16 px-1 text-center font-semibold tabular-nums"
              />

              <div
                role="radiogroup"
                aria-label="AM or PM"
                onKeyDown={handleMeridiemKeyDown}
                className="ml-1 flex h-9 items-center gap-0.5 rounded-md border bg-background p-0.5"
              >
                {(["AM", "PM"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    role="radio"
                    aria-checked={meridiem === period}
                    className={segmentClassName(meridiem === period)}
                    onClick={() => selectMeridiem(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t pt-3">
              {onClear && value ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground"
                  onClick={handleClear}
                >
                  Clear
                </Button>
              ) : (
                <span aria-hidden />
              )}
              <Button type="button" size="sm" className="h-8 px-4" onClick={confirmAndClose}>
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
TimePicker.displayName = "TimePicker";
