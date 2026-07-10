import { useState, useEffect } from "react"
import { useAchievements } from "@/hooks/useAchievements"
import type { Achievement, AchievementRarity } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FadeIn } from "@/components/ui/page-transition"
import { formatRelativeDate } from "@/lib/utils"
import {
  Trophy, Star, Crown, Flame, Brain, Zap, Target, Award,
  Sparkles, BookOpen, Clock, Medal, Gem, Rocket, Shield,
  Lock, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

// 晨雾纸页稀有度配置
const RARITY_CONFIG: Record<AchievementRarity, {
  label: string
  labelEn: string
  textColor: string
  bgColor: string   // 淡底 badge 色
  borderColor: string
  order: number
}> = {
  common: {
    label: "普通",
    labelEn: "Common",
    textColor: "text-ink-600",
    bgColor: "bg-ink-50",
    borderColor: "border-ink-200",
    order: 3,
  },
  rare: {
    label: "稀有",
    labelEn: "Rare",
    textColor: "text-amber",
    bgColor: "bg-amber-50",
    borderColor: "border-amber/30",
    order: 2,
  },
  epic: {
    label: "史诗",
    labelEn: "Epic",
    textColor: "text-ink-800",
    bgColor: "bg-ink-100",
    borderColor: "border-ink-300",
    order: 1,
  },
  legendary: {
    label: "传说",
    labelEn: "Legendary",
    textColor: "text-amber",
    bgColor: "bg-amber-100",
    borderColor: "border-amber/40",
    order: 0,
  },
}

const ACHIEVEMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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

export default function AchievementsPage() {
  const { achievements, stats, loading } = useAchievements()
  const [activeFilter, setActiveFilter] = useState<AchievementRarity | "all">("all")

  const rarityGroups = (Object.keys(RARITY_CONFIG) as AchievementRarity[])
    .sort((a, b) => RARITY_CONFIG[a].order - RARITY_CONFIG[b].order)

  const filteredAchievements = activeFilter === "all"
    ? achievements
    : achievements.filter(a => a.rarity === activeFilter)

  const groupedByRarity = rarityGroups.reduce((acc, rarity) => {
    acc[rarity] = filteredAchievements.filter(a => a.rarity === rarity)
    return acc
  }, {} as Record<AchievementRarity, Achievement[]>)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn className="spring-enter">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-ink-800">
              成就徽章
            </h1>
            <p className="text-ink-400 mt-1 text-sm">解锁成就，记录你的学习旅程</p>
          </div>
        </div>
      </FadeIn>

      {/* 稀有度 Tabs - 下划线风格 */}
      <FadeIn delay={50}>
        <div className="flex items-center gap-6 border-b border-gray-200">
          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative",
              activeFilter === "all"
                ? "text-ink-800"
                : "text-ink-400 hover:text-ink-600"
            )}
          >
            全部
            {activeFilter === "all" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink-800 rounded-full" />
            )}
          </button>
          {rarityGroups.map((rarity) => {
            const config = RARITY_CONFIG[rarity]
            const count = stats?.by_rarity?.[rarity]?.unlocked || 0
            return (
              <button
                key={rarity}
                onClick={() => setActiveFilter(rarity)}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative flex items-center gap-1.5",
                  activeFilter === rarity
                    ? config.textColor
                    : "text-ink-400 hover:text-ink-600"
                )}
              >
                <Gem className="w-3.5 h-3.5" />
                {config.label}
                <span className="text-xs opacity-60">({count})</span>
                {activeFilter === rarity && (
                  <span className={cn("absolute bottom-0 left-0 right-0 h-0.5 rounded-full", activeFilter === "rare" || activeFilter === "legendary" ? "bg-amber" : "bg-ink-800")} />
                )}
              </button>
            )
          })}
        </div>
      </FadeIn>

      {/* Overview Card - 白纸 + 环形进度 */}
      <FadeIn delay={100}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              {/* Total progress - ink-700 环形 */}
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="#e8e8f0"
                      strokeWidth="6"
                    />
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none"
                      stroke="#25253d"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(stats?.completion_rate || 0) * 2.136} 213.6`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-display font-bold text-ink-800">{stats?.unlocked || 0}</span>
                    <span className="text-[10px] text-ink-400 font-medium">/ {stats?.total || 0}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-ink-400">收集进度</p>
                  <p className="text-2xl font-display font-bold text-ink-800">
                    {(stats?.completion_rate || 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    已解锁 {stats?.unlocked || 0} / 共 {stats?.total || 20} 个成就
                  </p>
                </div>
              </div>

              {/* Rarity distribution */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:max-w-xl">
                {rarityGroups.map((rarity) => {
                  const config = RARITY_CONFIG[rarity]
                  const data = stats?.by_rarity?.[rarity] || { total: 0, unlocked: 0 }
                  const pct = data.total > 0 ? (data.unlocked / data.total) * 100 : 0
                  return (
                    <div
                      key={rarity}
                      className={cn(
                        "p-3 rounded-lg border transition-shadow hover:shadow-md",
                        "bg-white",
                        config.borderColor
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Gem className={cn("w-4 h-4", config.textColor)} />
                        <span className={cn("text-xs font-semibold", config.textColor)}>{config.label}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-display font-bold text-ink-800">{data.unlocked}</span>
                        <span className="text-xs text-ink-400">/ {data.total}</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-paper-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", rarity === "rare" || rarity === "legendary" ? "bg-amber" : "bg-ink-700")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Achievement groups by rarity */}
      {rarityGroups.map((rarity) => {
        const config = RARITY_CONFIG[rarity]
        const items = groupedByRarity[rarity]
        if (items.length === 0) return null

        return (
          <div key={rarity} className="space-y-3">
              {/* Section header */}
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", config.bgColor, config.borderColor)}>
                  <Gem className={cn("w-4 h-4", config.textColor)} />
                </div>
                <div>
                  <h2 className={cn("text-base font-display font-bold", config.textColor)}>
                    {config.label}成就
                    <span className="ml-2 text-xs font-normal text-ink-400">
                      {items.filter(a => a.unlocked).length} / {items.length}
                    </span>
                  </h2>
                  <p className="text-xs text-ink-400">{config.labelEn}</p>
                </div>
              </div>

              {/* Achievement grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((achievement, i) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    delay={i * 50}
                  />
                ))}
              </div>
            </div>
        )
      })}

      {/* Empty state for filter */}
      {filteredAchievements.length === 0 && !loading && (
        <FadeIn>
          <Card className="text-center py-16 border-dashed">
            <CardContent>
              <Lock className="w-12 h-12 mx-auto text-ink-300 mb-3" />
              <p className="text-ink-400">该分类暂无成就</p>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}

function AchievementCard({ achievement, delay = 0 }: { achievement: Achievement; delay?: number }) {
  const config = RARITY_CONFIG[achievement.rarity]
  const Icon = getIcon(achievement.icon)
  const progressPct = achievement.progress_target
    ? ((achievement.progress || 0) / achievement.progress_target) * 100
    : achievement.unlocked ? 100 : 0

  return (
    <div className="stagger-item" style={{ animationDelay: `${delay}ms` }}>
      <Card className={cn(
        "group transition-shadow duration-200",
        achievement.unlocked
          ? "hover:shadow-md"
          : "opacity-60"
      )}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              achievement.unlocked
                ? cn(config.bgColor, "border", config.borderColor, "hub-glow")
                : "bg-paper-200 border border-paper-200"
            )}>
              {achievement.unlocked ? (
                <Icon className={cn("w-6 h-6", config.textColor)} />
              ) : (
                <Lock className="w-5 h-5 text-ink-300" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className={cn(
                  "font-display font-bold text-sm leading-tight",
                  achievement.unlocked ? "text-ink-800" : "text-ink-400"
                )}>
                  {achievement.name}
                </h3>
                <Badge
                  className={cn(
                    "shrink-0 text-[10px] px-1.5 py-0 rounded-md font-medium border-0",
                    config.bgColor,
                    config.textColor
                  )}
                >
                  {config.label}
                </Badge>
              </div>

              <p className="text-xs text-ink-400 mt-1 line-clamp-2">
                {achievement.description}
              </p>

              {/* XP reward */}
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-3 h-3 text-amber fill-amber" />
                <span className="text-[11px] font-medium text-amber">
                  +{achievement.xp_reward} XP
                </span>
              </div>

              {/* Progress bar */}
              {!achievement.unlocked && achievement.progress_target && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-ink-400 mb-1">
                    <span>进度</span>
                    <span>{achievement.progress || 0} / {achievement.progress_target}</span>
                  </div>
                  <div className="h-1.5 bg-paper-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ink-400 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Unlocked date */}
              {achievement.unlocked && achievement.unlocked_at && (
                <div className="flex items-center gap-1 mt-3">
                  <Check className="w-3 h-3 text-ink-700" />
                  <span className="text-[10px] text-ink-500 font-medium">
                    {formatRelativeDate(achievement.unlocked_at)}解锁
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
