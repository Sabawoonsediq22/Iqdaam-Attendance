import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  // `.skeleton` is the shared shimmer from app/globals.css — the same one
  // components/loader.tsx uses, so all skeletons animate identically.
  return (
    <div
      className={cn("skeleton rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
