import { Check, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AttendanceStatus = "present" | "absent" | "late";

/**
 * Tonal status colours come straight from the design tokens
 * (--success / --destructive / --warning), so they stay correct in both
 * light and dark mode and can never drift from the rest of the app.
 */
const config: Record<
  AttendanceStatus,
  { label: string; icon: typeof Check; className: string }
> = {
  present: {
    label: "Present",
    icon: Check,
    className: "border-success/20 bg-success/10 text-success",
  },
  absent: {
    label: "Absent",
    icon: X,
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  late: {
    label: "Late",
    icon: Clock,
    className: "border-warning/20 bg-warning/10 text-warning",
  },
};

interface AttendanceBadgeProps {
  status: AttendanceStatus;
  /** Icon-only circular badge (used inside dense tables/lists). */
  compact?: boolean;
  className?: string;
}

export function AttendanceBadge({
  status,
  compact = false,
  className,
}: AttendanceBadgeProps) {
  const { label, icon: Icon, className: statusClassName } = config[status];

  if (compact) {
    return (
      <span
        title={label}
        aria-label={label}
        data-testid={`badge-${status}`}
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full border",
          statusClassName,
          className
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  }

  return (
    <Badge
      variant="outline"
      data-testid={`badge-${status}`}
      className={cn(statusClassName, className)}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </Badge>
  );
}
