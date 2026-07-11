import { useAchievements } from "@/hooks/useAchievements"
import type { AchievementRarity } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Trophy, Star, Crown, Flame, Brain, Zap, Target, Award,
  Sparkles, BookOpen, Clock, Medal, Gem, Rocket, Shield,
} from "lucide-react"

// 图标映射表：后端 icon 字段 -> lucide-react 图标组件
const ACHIEVEMENT_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number; size?: string | number }>> = {
  trophy: Trophy,
  star: Star,
  crown: Crown,
  flame: Flame,
  brain: Brain,
  zap: Zap,
  target: Target,
  award: Award,
  sparkles: Sparkles,
  book: BookOpen,
  clock: Clock,
  medal: Medal,
  gem: Gem,
  rocket: Rocket,
  shield: Shield,
}

function getIcon(iconName: string) {
  return ACHIEVEMENT_ICONS[iconName] || Trophy
}

// 稀有度样式映射（后端 common/rare/epic/legendary）
const RARITY_STYLES: Record<AchievementRarity, { label: string; color: string; bgColor: string; iconColor: string }> = {
  common: { label: "普通", color: "text-ink-600", bgColor: "bg-ink-50", iconColor: "text-ink-600" },
  rare: { label: "稀有", color: "text-amber", bgColor: "bg-amber-50", iconColor: "text-amber" },
  epic: { label: "史诗", color: "text-ink-800", bgColor: "bg-ink-100", iconColor: "text-ink-800" },
  legendary: { label: "传说", color: "text-amber", bgColor: "bg-amber-100", iconColor: "text-amber" },
}

export function AchievementBadges() {
  const { achievements, loading } = useAchievements()

  const unlockedCount = achievements.filter(a => a.unlocked).length

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink-800 font-sans">成就徽章</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200 font-sans">
              <Skeleton className="h-3 w-8 inline-block align-middle" />
            </span>
          </div>
          <span className="text-xs text-ink-400 font-sans">解锁更多徽章继续努力</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink-800 font-sans">成就徽章</span>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200 font-sans">
            {unlockedCount}/{achievements.length}
          </span>
        </div>
        <span className="text-xs text-ink-400 font-sans">解锁更多徽章继续努力</span>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {achievements.map((a, i) => {
          const Icon = getIcon(a.icon)
          const progressNum = typeof a.progress === 'number' ? a.progress : (a.unlocked ? 1 : 0)
          const progressPct = a.progress_target
            ? (progressNum / a.progress_target) * 100
            : a.unlocked ? 100 : 0
          const rarity = RARITY_STYLES[a.rarity]

          return (
            <div
              key={a.id}
              className="stagger-item group relative flex flex-col items-center"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative">
                <div
                  className={cn(
                    "relative w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-200",
                    a.unlocked
                      ? `${rarity.bgColor} border-ink-800/20`
                      : "bg-paper-100 border-[var(--border-light)] opacity-60"
                  )}
                >
                  <Icon className={cn("w-5 h-5", a.unlocked ? rarity.iconColor : "text-ink-300")} strokeWidth={1.75} />

                  {!a.unlocked && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white border border-[var(--border-light)] flex items-center justify-center text-[9px] font-semibold text-ink-400 font-sans">
                      {Math.round(progressPct)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 px-3 py-2 bg-white border border-[var(--border-light)] rounded-lg shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-20">
                <p className="text-sm font-semibold text-ink-800 font-sans">{a.name}</p>
                <p className="text-[10px] text-ink-400 font-sans">{a.description}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold font-sans ${rarity.color}`}>{rarity.label}级</span>
                  <span className="text-[10px] text-ink-400 font-sans">{progressNum}/{a.progress_target || 0}</span>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-white" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
