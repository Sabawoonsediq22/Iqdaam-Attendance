import * as React from "react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  text?: string
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size = "md", text, ...props }, ref) => {

    const uibSize = {
      sm: '2rem',
      md: '2.8rem',
      lg: '4rem'
    }[size];

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3",
          className
        )}
        {...props}
      >
        <div className="dot-spinner" style={{ '--uib-size': uibSize } as React.CSSProperties}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="dot-spinner__dot" />
          ))}
        </div>
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