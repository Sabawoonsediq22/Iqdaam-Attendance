import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /**
   * Optional in-page heading. Omit it when the application shell already
   * renders the route title in the top bar (the default for every page) and
   * only pass it for content that genuinely has its own heading
   * (e.g. a dashboard greeting banner).
   */
  title?: string;
  /** One short sentence describing the page. Rendered as secondary text. */
  description?: string;
  /** Primary/secondary page actions, right-aligned on desktop. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Standard page header: description + actions on a single predictable row.
 * Every dashboard page uses this so headers, spacing and action placement
 * never drift between screens.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  if (!title && !description && !actions) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {title && (
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        )}
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
