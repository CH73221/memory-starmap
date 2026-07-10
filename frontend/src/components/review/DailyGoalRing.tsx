import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DailyGoalRing({ current, goal }: { current: number; goal: number }) {
  const pct = Math.min((current / goal) * 100, 100)
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const done = current >= goal

  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg
        className={cn("w-full h-full -rotate-90", done && "spring-enter")}
        viewBox="0 0 64 64"
      >
        {/* 背景环 - 细线 */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--border-light)"
          strokeWidth="2"
        />
        {/* 进度环 - 细线墨蓝 */}
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke={done ? "#c87941" : "#1a1a2e"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* 中心内容 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {done ? (
          <Check className="w-5 h-5 text-amber number-pop" strokeWidth={2.5} />
        ) : (
          <>
            <span className="text-sm font-display font-semibold text-ink-800 leading-none tabular-nums">
              {current}
            </span>
            <span className="text-[8px] text-ink-400 font-sans leading-none">/{goal}</span>
          </>
        )}
      </div>
    </div>
  )
}
