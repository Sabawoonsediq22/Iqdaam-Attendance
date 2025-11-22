import { Badge } from "@/components/ui/badge";
import { Check, X, Clock } from "lucide-react";

export type AttendanceStatus = "present" | "absent" | "late";

interface AttendanceBadgeProps {
  status: AttendanceStatus;
  compact?: boolean;
}

export function AttendanceBadge({ status, compact = false }: AttendanceBadgeProps) {
  const config = {
    present: {
      label: "Present",
      icon: Check,
      className: "bg-green-50 text-green-700 border-green-200",
    },
    absent: {
      label: "Absent",
      icon: X,
      className: "bg-red-50 text-red-700 border-red-200",
    },
    late: {
      label: "Late",
      icon: Clock,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
  };

  const { label, icon: Icon, className } = config[status];

  if (compact) {
    return (
      <div
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full border ${className}`}
        title={label}
        data-testid={`badge-${status}`}
      >
        <Icon className="h-3 w-3" />
      </div>
    );
  }

  return (
    <Badge variant="outline" className={className} data-testid={`badge-${status}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}
