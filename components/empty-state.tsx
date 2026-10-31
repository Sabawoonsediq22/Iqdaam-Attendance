import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  /** Lucide icon rendered inside a neutral chip. */
  icon?: LucideIcon;
  /** Headline: what is missing, in plain language. */
  title: string;
  /** One supporting sentence. Keep it actionable. */
  description?: string;
  /** Optional call to action (usually a Button). */
  action?: ReactNode;
  /** Render without the surrounding Card (when already inside one). */
  bare?: boolean;
  className?: string;
}

/**
 * The single empty-state pattern for the whole application:
 * icon chip + title + description (+ optional action), vertically centred
 * with consistent padding. Use it everywhere instead of ad-hoc <p> tags.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bare = false,
  className,
}: EmptyStateProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );

  if (bare) return content;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">{content}</CardContent>
    </Card>
  );
}
