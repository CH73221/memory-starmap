import { useState, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

interface ScrollProgressProps {
  className?: string
}

export function ScrollProgress({ className }: ScrollProgressProps) {
  const [progress, setProgress] = useState(0)
  const location = useLocation()

  useEffect(() => {
    const main = document.querySelector("main")
    if (!main) return

    const handleScroll = () => {
      const scrollTop = main.scrollTop
      const scrollHeight = main.scrollHeight - main.clientHeight
      const p = scrollHeight > 0 ? scrollTop / scrollHeight : 0
      setProgress(Math.min(1, Math.max(0, p)))
    }

    main.addEventListener("scroll", handleScroll, { passive: true })
    return () => main.removeEventListener("scroll", handleScroll)
  }, [location.pathname])

  return (
    <div className={cn("relative", className)}>
      {/* 细线进度条 - 墨蓝色，无发光无渐变 */}
      <div className="relative h-[2px] bg-[var(--border-light)] rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-ink-800 rounded-full transition-all duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
