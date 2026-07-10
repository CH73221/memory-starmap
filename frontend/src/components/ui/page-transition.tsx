import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  distance?: number
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 400,
  direction = "up",
  distance = 16,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dirTransform = direction !== "none" ? `translateY(${distance}px)` : undefined
  const directionStyles: Record<string, string> = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px})`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
  }

  return (
    <div
      ref={ref}
      className={cn("transition-all", className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate(0, 0)" : (directionStyles[direction] || "translate(0, 0)"),
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  )
}

interface StaggerChildrenProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  baseDelay?: number
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 60,
  baseDelay = 0,
}: StaggerChildrenProps) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? (children as ReactNode[]).map((child, i) => (
            <FadeIn key={i} delay={baseDelay + i * staggerDelay}>
              {child}
            </FadeIn>
          ))
        : children}
    </div>
  )
}
