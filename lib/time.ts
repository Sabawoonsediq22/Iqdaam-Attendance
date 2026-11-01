/**
 * Time helpers for Attendly class scheduling.
 *
 * Class times are stored in the database as plain text in the app's
 * canonical 12-hour format — `h:mm A` (e.g. `"4:30 PM"`) — which is the
 * format the previous time picker produced. Everything in this module is
 * pure integer arithmetic over clock components: no `Date` parsing, no
 * timezone conversion, so values round-trip exactly as the teacher entered
 * them (avoids the classic "date string reinterpreted in another TZ" bugs).
 */

export type TimeOfDay = {
  /** 1–12 */
  hour: number;
  /** 0–59 */
  minute: number;
  meridiem: "AM" | "PM";
};

/** Default class length when no previous duration is known (60 minutes). */
export const DEFAULT_CLASS_DURATION_MINUTES = 60;

/** Matches `4:30 PM`, `4:30pm`, `4.30`, `16:30`, `4 PM`, `12:05 a.m.`, `4:30`. */
const TIME_PATTERN = /^(\d{1,2})(?:[.:](\d{1,2}))?\s*(a\.?m\.?|p\.?m\.?)?$/i;

/**
 * Parses a stored/user-entered time string into clock components.
 * Returns `null` for anything that is not a valid clock time.
 */
export function parseTime(value: string | null | undefined): TimeOfDay | null {
  if (!value) return null;

  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;

  const rawHour = Number(match[1]);
  const rawMinute = match[2] === undefined ? 0 : Number(match[2]);
  if (rawMinute > 59) return null;

  const meridiemSuffix = match[3]?.toLowerCase().replace(/\./g, "");
  let hour = rawHour;
  let meridiem: "AM" | "PM" | undefined;

  if (meridiemSuffix === "am" || meridiemSuffix === "pm") {
    // Explicit meridiem requires a 1–12 hour ("13 PM" is invalid).
    if (hour < 1 || hour > 12) return null;
    meridiem = meridiemSuffix.toUpperCase() as "AM" | "PM";
  } else {
    // No meridiem: treat 13–23 (and 0) as a 24-hour clock, otherwise assume
    // 12-hour with the conventional defaults (0 → 12 AM, 12 → 12 PM).
    if (hour > 23) return null;
    if (hour === 0) {
      hour = 12;
      meridiem = "AM";
    } else if (hour === 12) {
      meridiem = "PM";
    } else if (hour > 12) {
      hour -= 12;
      meridiem = "PM";
    } else {
      meridiem = "AM";
    }
  }

  return { hour, minute: rawMinute, meridiem };
}

/** Formats clock components into the canonical stored form: `"4:30 PM"`. */
export function formatTime(time: TimeOfDay): string {
  return `${time.hour}:${String(time.minute).padStart(2, "0")} ${time.meridiem}`;
}

/** Minutes since midnight (0–1439) for a given clock time. */
export function timeToMinutes(time: TimeOfDay): number {
  const hour24 =
    time.meridiem === "AM"
      ? time.hour === 12
        ? 0
        : time.hour
      : time.hour === 12
        ? 12
        : time.hour + 12;
  return hour24 * 60 + time.minute;
}

/** Clock components for a minutes-since-midnight value (wraps at 24h). */
export function minutesToTime(totalMinutes: number): TimeOfDay {
  const wrapped = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hour24 = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  return {
    hour: hour24 % 12 === 0 ? 12 : hour24 % 12,
    minute,
    meridiem: hour24 < 12 ? "AM" : "PM",
  };
}

/** Adds (or subtracts) minutes to a clock time, wrapping within one day. */
export function addMinutes(time: TimeOfDay, minutes: number): TimeOfDay {
  return minutesToTime(timeToMinutes(time) + minutes);
}

/**
 * Whole minutes from `start` to `end`.
 * Returns `null` when the range is invalid (end not later than start —
 * overnight classes are intentionally not supported).
 */
export function minutesBetween(
  start: TimeOfDay,
  end: TimeOfDay
): number | null {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  return diff > 0 ? diff : null;
}

/** Human-readable duration: `45m`, `1h`, `1h 30m`. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/**
 * Display range for a class schedule, e.g. `"4:30 PM - 6:00 PM"`.
 * Falls back to the start time when no end time exists (legacy rows).
 */
export function formatTimeRange(
  startTime?: string | null,
  endTime?: string | null
): string {
  if (!startTime) return endTime ?? "";
  if (!endTime) return startTime;
  return `${startTime} - ${endTime}`;
}
