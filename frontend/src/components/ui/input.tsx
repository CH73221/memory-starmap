import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-white",
          "px-3 py-2 text-sm text-ink-800 font-sans",
          "placeholder:text-ink-400",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:border-ink-600 focus-visible:bg-ink-50/30",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink-700",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
