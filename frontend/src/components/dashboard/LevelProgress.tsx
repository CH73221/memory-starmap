import { cn } from "@/lib/utils"

interface Props {
  totalReviews: number
  masteredPoints: number
  className?: string
}

const XP_PER_REVIEW = 10
const XP_PER_MASTER = 50

function calculateLevel(xp: number): { level: number; title: string; currentXp: number; nextLevelXp: number; progress: number } {
  let level = 1, xpForCurrent = 0, xpForNext = 100
  while (xp >= xpForNext) { level++; xpForCurrent = xpForNext; xpForNext += level * 100 }
  const progress = ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100
  const titles: Record<number, string> = { 1: "初学者", 2: "勤奋学徒", 3: "知识新手", 4: "学习达人", 5: "记忆专家", 6: "学术精英", 7: "学神", 8: "学霸之巅", 9: "知识大师", 10: "传奇学者" }
  return { level, title: titles[Math.min(level, 10)] || "传奇学者", currentXp: xp - xpForCurrent, nextLevelXp: xpForNext - xpForCurrent, progress }
}

export function LevelProgress({ totalReviews, masteredPoints, className }: Props) {
  const totalXp = totalReviews * XP_PER_REVIEW + masteredPoints * XP_PER_MASTER
  const { level, title, currentXp, nextLevelXp, progress } = calculateLevel(totalXp)

  return (
    <div className={cn("hover-lift flex items-center gap-5 py-4", className)}>
      {/* Level 数字 */}
      <div className="shrink-0 w-14 h-14 rounded-xl bg-ink-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[9px] font-medium text-white/60 uppercase tracking-widest leading-none">Lv</p>
          <p className="text-2xl font-display font-semibold text-white leading-none mt-0.5">{level}</p>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-base font-display font-semibold text-ink-800">{title}</span>
          </div>
          <span className="text-xs text-ink-400 font-sans tabular-nums">{totalXp.toLocaleString()} XP</span>
        </div>

        {/* 细线进度条 */}
        <div className="h-[2px] bg-[var(--border-light)] rounded-full overflow-hidden">
          <div
            className="h-full bg-amber rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-ink-400 font-sans tabular-nums">
          <span>{currentXp} XP</span>
          <span>下一级 {nextLevelXp} XP</span>
        </div>
      </div>
    </div>
  )
}
