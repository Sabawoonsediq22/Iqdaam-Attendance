import * as React from "react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  variant?: "spinner" | "dots"
  text?: string
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size = "md", variant = "spinner", text, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-8 h-8",
      lg: "w-12 h-12",
    }

    const SpinnerLoader = () => (
      <div className={cn("relative", sizeClasses[size])}>
        <div className="absolute inset-0 rounded-full border-2 border-muted border-t-primary animate-spin" />
        <div className="absolute inset-1 rounded-full border-2 border-muted border-t-primary animate-spin animation-delay-150" />
      </div>
    )

    const DotsLoader = () => (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-primary rounded-full animate-bounce",
              size === "sm" && "w-2 h-2",
              size === "md" && "w-3 h-3",
              size === "lg" && "w-4 h-4"
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    )

    const renderLoader = () => {
      switch (variant) {
        case "dots":
          return <DotsLoader />
        default:
          return <SpinnerLoader />
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3",
          className
        )}
        {...props}
      >
        {renderLoader()}
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    )
  }
)

Loader.displayName = "Loader"

export { Loader }