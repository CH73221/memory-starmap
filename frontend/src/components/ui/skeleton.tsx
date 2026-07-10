import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-paper-200 relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-paper-100 before:to-transparent",
        "before:animate-[shimmer_2s_infinite_linear]",
        "before:-translate-x-full",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
