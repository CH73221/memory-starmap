import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-600/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-ink-800 text-white hover:bg-ink-900 hover:shadow-md hover:shadow-ink-800/10 active:bg-ink-900",
        secondary:
          "bg-paper-100 text-ink-700 hover:bg-paper-200 hover:shadow-sm",
        outline:
          "border border-border bg-transparent text-ink-700 hover:bg-ink-50 hover:border-border-strong hover:shadow-sm",
        ghost:
          "text-ink-600 hover:bg-paper-100 hover:text-ink-800",
        destructive:
          "bg-error text-white hover:bg-error/90 hover:shadow-md hover:shadow-error/20",
        link:
          "text-ink-700 underline-offset-4 hover:underline hover:text-ink-900",
        amber:
          "bg-amber text-white hover:bg-amber-700 hover:shadow-md hover:shadow-amber/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
