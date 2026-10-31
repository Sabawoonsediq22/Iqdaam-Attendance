import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Semantic tints — the only colours a stat card may use. */
const tones = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
} as const;

export type StatCardTone = keyof typeof tones;

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  /** Icon chip tint. Defaults to the brand primary. */
  tone?: StatCardTone;
  /** Small supporting line under the value (e.g. a comparison). */
  description?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

/**
 * The standard statistics card: label (14px muted), value (24px semibold)
 * and a tinted icon chip. Used by every summary/statistics section so the
 * "big number" treatment is identical across the app.
 */
export function StatsCard({
  title,
  value,
  icon: Icon,
  tone = "primary",
  description,
  trend,
  className,
}: StatsCardProps) {
  const testId = title.toLowerCase().replace(/\s+/g, "-");

  return (
    <Card
      data-testid={`stats-${testId}`}
      className={cn("bg-card", className)}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            tones[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="text-2xl font-semibold tracking-tight"
          data-testid={`value-${testId}`}
        >
          {value}
        </div>
        {trend && (
          <p
            className={cn(
              "mt-1 text-xs",
              trend.positive ? "text-success" : "text-destructive"
            )}
          >
            {trend.value}
          </p>
        )}
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
