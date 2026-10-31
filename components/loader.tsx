import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LoaderVariant = "orbit" | "skeleton";

/**
 * Page-aware skeleton shapes. Each mirrors the real layout of the page it
 * precedes, so loading feels like a preview rather than a blank placeholder.
 */
type SkeletonShape =
  | "generic"
  | "dashboard"
  | "users"
  | "students"
  | "classes"
  | "fees"
  | "notifications"
  | "attendance"
  | "attendance-list"
  | "reports"
  | "settings";

type LoaderSize = "sm" | "md" | "lg";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: LoaderSize;
  text?: string;
  variant?: LoaderVariant;
  /** Layout preview to show when variant="skeleton" (default: generic). */
  shape?: SkeletonShape;
}

/* Brand mark with dots orbiting around it */
const orbitSizes: Record<LoaderSize, { tile: string; logo: number; dot: string }> = {
  sm: { tile: "h-8 w-8", logo: 16, dot: "h-1 w-1" },
  md: { tile: "h-12 w-12", logo: 26, dot: "h-1.5 w-1.5" },
  lg: { tile: "h-16 w-16", logo: 36, dot: "h-2 w-2" },
};

/* Number of repeating rows in row-based skeletons */
const rowsBySize: Record<LoaderSize, number> = { sm: 2, md: 4, lg: 6 };

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  (
    { className, size = "md", text, variant = "orbit", shape = "generic", ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-busy="true"
        className={cn(
          "flex flex-col gap-3",
          variant === "skeleton"
            ? "w-full max-w-lg select-none"
            : "items-center justify-center",
          className
        )}
        {...props}
      >
        {variant === "skeleton" ? (
          <SkeletonPreview size={size} shape={shape} />
        ) : (
          <OrbitLoader size={size} />
        )}

        {text ? (
          <p
            className={cn(
              "animate-pulse text-sm text-muted-foreground",
              variant === "skeleton" && "text-center"
            )}
          >
            {text}
          </p>
        ) : (
          <span className="sr-only">Loading…</span>
        )}
      </div>
    );
  }
);
Loader.displayName = "Loader";

function OrbitLoader({ size }: { size: LoaderSize }) {
  const { tile, logo, dot } = orbitSizes[size];

  return (
    <div className={cn("relative", tile)}>
      {/* Track */}
      <span className="absolute inset-0 rounded-full border border-border" />

      {/* Orbiting dots */}
      <span className="loading-orbit-spin absolute inset-0">
        <span
          className={cn(
            "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary",
            dot
          )}
        />
        <span
          className={cn(
            "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary/30",
            dot
          )}
        />
      </span>

      {/* Breathing brand tile */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="loading-breathe flex h-[58.5%] w-[58.5%] items-center justify-center overflow-hidden rounded-xl border border-card-border bg-card shadow-xs">
          <Image
            src="/iqdaam.jpg"
            alt=""
            width={logo}
            height={logo}
            aria-hidden
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

function SkeletonPreview({
  size,
  shape,
}: {
  size: LoaderSize;
  shape: SkeletonShape;
}) {
  switch (shape) {
    case "dashboard":
      return <DashboardSkeleton />;
    case "users":
      return <UsersSkeleton rows={rowsBySize[size]} />;
    case "students":
      return <StudentsSkeleton />;
    case "classes":
      return <ClassesSkeleton />;
    case "fees":
      return <FeesSkeleton />;
    case "notifications":
      return <NotificationsSkeleton rows={rowsBySize[size]} />;
    case "attendance":
      return <AttendanceSkeleton rows={rowsBySize[size]} />;
    case "attendance-list":
      return <AttendanceListSkeleton rows={rowsBySize[size]} />;
    case "reports":
      return <ReportsSkeleton />;
    case "settings":
      return <SettingsSkeleton />;
    default:
      return <GenericSkeleton size={size} />;
  }
}

/* ---------- Shape primitives ---------- */

function PersonRow({ pill = true }: { pill?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <SkeletonBlock className="h-3 w-2/3 rounded-full" />
        <SkeletonBlock className="h-2.5 w-1/4 rounded-full" />
      </div>
      {pill && <SkeletonBlock className="h-6 w-14 shrink-0 rounded-full" />}
    </div>
  );
}

/* ---------- Page shapes ---------- */

/* Dashboard: key-metric cards + trend chart + side chart + activity cards */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {/* Key metrics grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4">
        <SkeletonBlock className="h-24 rounded-xl sm:h-28" />
        <SkeletonBlock className="h-24 rounded-xl sm:h-28" />
        <SkeletonBlock className="h-24 rounded-xl sm:h-28" />
        <SkeletonBlock className="h-24 rounded-xl sm:h-28" />
      </div>

      {/* Trend chart (wide) + distribution (side) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock className="h-56 rounded-xl sm:h-64 lg:col-span-2" />
        <SkeletonBlock className="h-56 rounded-xl sm:h-64" />
      </div>

      {/* Activity / overview cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonBlock className="h-36 rounded-xl sm:h-40" />
        <SkeletonBlock className="h-36 rounded-xl sm:h-40" />
      </div>
    </div>
  );
}

/* Users: card of user tiles (large avatar, name, badges) — page heading is static */
function UsersSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {/* User tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-card-border bg-card p-3 sm:p-4"
          >
            <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full sm:h-14 sm:w-14" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-3.5 w-2/3 rounded-full" />
              <SkeletonBlock className="h-2.5 w-1/2 rounded-full" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <SkeletonBlock className="h-5 w-16 rounded-full" />
              <SkeletonBlock className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Students: class cards, each holding student tiles — heading/search stay visible */
function StudentsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="grid gap-4 sm:grid-cols-2">
        {[3, 3].map((count, i) => (
          <div
            key={i}
            className="rounded-xl border border-card-border bg-card p-4"
          >
            {/* Class header */}
            <div className="mb-3 flex items-center gap-2">
              <SkeletonBlock className="h-5 w-5 shrink-0 rounded-md" />
              <SkeletonBlock className="h-3.5 w-28 rounded-lg" />
              <SkeletonBlock className="ml-auto h-5 w-14 rounded-full" />
            </div>
            {/* Student tiles */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: count }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 rounded-lg border border-card-border bg-card p-3"
                >
                  <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
                  <SkeletonBlock className="h-2.5 w-2/3 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Classes: class cards grid — the filter toolbar above is static */
function ClassesSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {/* Class cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-card-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-2/3 rounded-lg" />
                <SkeletonBlock className="h-2.5 w-1/2 rounded-full" />
              </div>
              <SkeletonBlock className="h-8 w-8 shrink-0 rounded-lg" />
            </div>
            <div className="mt-3 flex gap-2">
              <SkeletonBlock className="h-6 w-16 rounded-full" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="h-6 w-14 rounded-full" />
            </div>
            <SkeletonBlock className="mt-4 h-2.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Fees: monthly stat cards + payment rows — page heading is static */
function FeesSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {/* Monthly summary cards */}
      <div className="grid gap-4 md:grid-cols-3 pt-4">
        <SkeletonBlock className="h-24 rounded-xl" />
        <SkeletonBlock className="h-24 rounded-xl" />
        <SkeletonBlock className="h-24 rounded-xl" />
      </div>

      {/* Fee rows */}
      <div className="rounded-xl border border-card-border p-4">
        <div className="space-y-4">
          {Array.from({ length: rowsBySize.md }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              {/* Student */}
              <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <SkeletonBlock className="h-3 w-2/3 rounded-full" />
                <SkeletonBlock className="h-2.5 w-1/3 rounded-full" />
              </div>
              {/* Amount + status + action */}
              <SkeletonBlock className="h-4 w-16 shrink-0 rounded-lg" />
              <SkeletonBlock className="h-6 w-14 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Notifications: list rows — filters/toolbar above are static */
function NotificationsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3 pt-4" aria-hidden>
      {/* Notification rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-card-border bg-card p-4"
          >
            {/* Type icon */}
            <SkeletonBlock className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <SkeletonBlock className="h-3.5 w-3/4 rounded-full" />
              <SkeletonBlock className="h-2.5 w-full rounded-full" />
              <SkeletonBlock className="h-2.5 w-1/3 rounded-full" />
            </div>
            {/* Time + action */}
            <SkeletonBlock className="h-2.5 w-14 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Attendance: class selector + students to mark (Suspense covers whole page) */
function AttendanceSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {/* Class / session selector */}
      <div className="rounded-xl border border-card-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-10 w-full rounded-lg sm:w-56" />
          <SkeletonBlock className="h-10 w-32 rounded-lg" />
          <SkeletonBlock className="ml-auto h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Students with status toggles */}
      <div className="rounded-xl border border-card-border bg-card p-4 sm:p-6">
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <SkeletonBlock className="h-3 w-1/2 rounded-full" />
                <SkeletonBlock className="h-2.5 w-1/4 rounded-full" />
              </div>
              {/* Status pills (present / absent) */}
              <div className="flex shrink-0 gap-1.5">
                <SkeletonBlock className="h-7 w-12 rounded-full" />
                <SkeletonBlock className="h-7 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Attendance list only: students with status toggles — selector above is static */
function AttendanceListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <SkeletonBlock className="h-3 w-1/2 rounded-full" />
              <SkeletonBlock className="h-2.5 w-1/4 rounded-full" />
            </div>
            <div className="flex shrink-0 gap-1.5">
              <SkeletonBlock className="h-7 w-12 rounded-full" />
              <SkeletonBlock className="h-7 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Reports: stat strip + two chart cards + data table */
function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className={cn("h-20 rounded-xl", i >= 3 && "hidden lg:block")}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonBlock className="h-56 rounded-xl sm:h-64" />
        <SkeletonBlock className="h-56 rounded-xl sm:h-64" />
      </div>

      <ReportsTableSkeleton rows={3} />
    </div>
  );
}

function ReportsTableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-xl border border-card-border">
      {/* Table header */}
      <div className="flex items-center gap-4 border-b border-card-border px-4 py-3">
        {["14", "24", "10", "20"].map((w, i) => (
          <SkeletonBlock
            key={i}
            className={cn(
              "h-2.5 shrink-0 rounded-full",
              i === 0 && "w-[14%]",
              i === 1 && "hidden sm:block sm:w-[24%]",
              i === 2 && "ml-auto w-[10%]",
              i === 3 && "hidden md:block md:w-[20%]"
            )}
          />
        ))}
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full" />
            <SkeletonBlock className="h-3 w-[18%] shrink-0 rounded-full" />
            <SkeletonBlock className="hidden h-2.5 sm:block sm:w-[22%] rounded-full" />
            <SkeletonBlock className="ml-auto h-6 w-14 shrink-0 rounded-full" />
            <SkeletonBlock className="hidden h-5 md:block md:w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Settings: profile card with avatar, fields and preference switches */
function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-4" aria-hidden>
      {/* Profile card */}
      <div className="rounded-xl border border-card-border bg-card p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <SkeletonBlock className="h-14 w-14 shrink-0 rounded-full sm:h-16 sm:w-16" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-40 rounded-lg" />
            <SkeletonBlock className="h-2.5 w-56 max-w-full rounded-full" />
          </div>
          <SkeletonBlock className="h-8 w-24 shrink-0 rounded-lg" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonBlock className="h-2.5 w-20 rounded-full" />
              <SkeletonBlock className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Preference rows with switches */}
      <div className="rounded-xl border border-card-border bg-card p-4 sm:p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <SkeletonBlock className="h-3 w-2/5 rounded-full" />
                <SkeletonBlock className="h-2.5 w-3/5 rounded-full" />
              </div>
              <SkeletonBlock className="h-5 w-9 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Generic fallback (previous default) */
function GenericSkeleton({ size }: { size: LoaderSize }) {
  return (
    <div className="flex flex-col" aria-hidden>
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-3.5 w-1/2 rounded-full" />
          <SkeletonBlock className="h-2.5 w-1/3 rounded-full" />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <SkeletonBlock className="h-24 flex-1 rounded-xl" />
        <SkeletonBlock className="h-24 flex-1 rounded-xl" />
        <SkeletonBlock className="hidden h-24 flex-1 rounded-xl sm:block" />
      </div>

      <div className="mt-5 space-y-3">
        {Array.from({ length: rowsBySize[size] }).map((_, i) => (
          <PersonRow key={i} />
        ))}
      </div>
    </div>
  );
}

export { Loader };
export type { SkeletonShape };
