import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors duration-150 font-sans",
  {
    variants: {
      variant: {
        default:
          "bg-ink-50 text-ink-700",
        secondary:
          "bg-paper-200 text-ink-600",
        destructive:
          "bg-error-bg text-error",
        outline:
          "border border-border text-ink-600",
        amber:
          "bg-amber-bg text-amber",
        success:
          "bg-success-bg text-success",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
