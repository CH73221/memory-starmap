import { useState, useEffect } from "react"
import type { Achievement, AchievementRarity } from "@/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Trophy, Star, Crown, Flame, Brain, Zap, Target, Award,
  Sparkles, BookOpen, Clock, Medal, Gem, Rocket, Shield,
  X,
} from "lucide-react"

// 晨雾纸页稀有度配置
const RARITY_CONFIG: Record<AchievementRarity, {
  label: string
  textColor: string
  bgColor: string
  borderColor: string
  iconColor: string  // 图标颜色
}> = {
  common: {
    label: "普通",
    textColor: "text-ink-600",
    bgColor: "bg-ink-50",
    borderColor: "border-ink-200",
    iconColor: "#4a4a6a",
  },
  rare: {
    label: "稀有",
    textColor: "text-amber",
    bgColor: "bg-amber-50",
    borderColor: "border-amber/30",
    iconColor: "#c87941",
  },
  epic: {
    label: "史诗",
    textColor: "text-ink-800",
    bgColor: "bg-ink-100",
    borderColor: "border-ink-300",
    iconColor: "#1a1a2e",
  },
  legendary: {
    label: "传说",
    textColor: "text-amber",
    bgColor: "bg-amber-100",
    borderColor: "border-amber/40",
    iconColor: "#c87941",
  },
}

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

interface AchievementUnlockModalProps {
  achievement: Achievement | null
  open: boolean
  onClose: () => void
}

export function AchievementUnlockModal({ achievement, open, onClose }: AchievementUnlockModalProps) {
  const [visible, setVisible] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; color: string; size: number }[]>([])

  useEffect(() => {
    if (open) {
      setVisible(true)
      // 少量克制彩纸：ink/amber/ink-400 三色
      const paperColors = ["#1a1a2e", "#c87941", "#6b6b8d"]
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: paperColors[i % paperColors.length],
        size: 5 + Math.random() * 4,
      }))
      setParticles(newParticles)

      setTimeout(() => setShowContent(true), 200)
    } else {
      setVisible(false)
      setShowContent(false)
      setParticles([])
    }
  }, [open, achievement?.rarity])

  if (!achievement || !open) return null

  const config = RARITY_CONFIG[achievement.rarity]
  const Icon = getIcon(achievement.icon)

  const handleClose = () => {
    setShowContent(false)
    setTimeout(() => onClose(), 200)
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* 背景遮罩 - 暖白纸半透明 */}
      <div
        className="absolute inset-0 bg-ink-900/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 少量克制彩纸 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.x}%`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "1px",
            }}
          />
        ))}
      </div>

      {/* Modal - 白纸 + 细边框 + 轻阴影 */}
      <div
        className={cn(
          "relative max-w-sm w-full transition-all duration-400 ease-out",
          showContent ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        )}
      >
        <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-lg">
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full hover:bg-paper-100 text-ink-400 hover:text-ink-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="relative p-8 text-center">
            {/* "Unlocked" label */}
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6",
              "bg-ink-50 text-ink-600",
              showContent ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
              "transition-all duration-300"
            )}
            style={{ transitionDelay: "100ms" }}
            >
              <Trophy className="w-3 h-3" />
              成就解锁！
            </div>

            {/* 成就图标 - 大尺寸，多层边框（不发光） */}
            <div className={cn(
              "relative inline-block mb-6",
              showContent ? "opacity-100 scale-100" : "opacity-0 scale-90",
              "transition-all duration-500 ease-out"
            )}
            style={{ transitionDelay: "200ms" }}
            >
              {/* 外层边框环 */}
              <div
                className={cn("absolute -inset-3 rounded-full border-2", config.borderColor, "opacity-40")}
              />
              {/* 中层白边 */}
              <div className="absolute -inset-1.5 rounded-full bg-white border border-gray-200" />
              {/* 图标圆形 */}
              <div
                className={cn(
                  "relative w-24 h-24 rounded-full flex items-center justify-center",
                  config.bgColor,
                  "border-2",
                  config.borderColor
                )}
              >
                <Icon className="w-12 h-12" style={{ color: config.iconColor }} />
              </div>
            </div>

            {/* 稀有度标签 - Badge amber 变体 */}
            <div className={cn(
              "mb-3",
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              "transition-all duration-300"
            )}
            style={{ transitionDelay: "350ms" }}
            >
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                config.bgColor,
                config.textColor,
                "border",
                config.borderColor
              )}>
                <Gem className="w-3 h-3" />
                {config.label}成就
              </span>
            </div>

            {/* 成就名称 - Fraunces 大字体 ink-800，无渐变 */}
            <h2 className={cn(
              "text-3xl font-display font-bold text-ink-800 mb-2",
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              "transition-all duration-300"
            )}
            style={{ transitionDelay: "450ms" }}
            >
              {achievement.name}
            </h2>

            {/* 描述 */}
            <p className={cn(
              "text-sm text-ink-500 mb-6 leading-relaxed",
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              "transition-all duration-300"
            )}
            style={{ transitionDelay: "550ms" }}
            >
              {achievement.description}
            </p>

            {/* XP 奖励 */}
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6",
              "bg-amber-50 border border-amber/20",
              showContent ? "opacity-100 scale-100" : "opacity-0 scale-90",
              "transition-all duration-300"
            )}
            style={{ transitionDelay: "650ms" }}
            >
              <Star className="w-5 h-5 text-amber fill-amber" />
              <span className="text-amber font-bold">+{achievement.xp_reward} XP</span>
            </div>

            {/* 按钮 */}
            <div className={cn(
              showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              "transition-all duration-300"
            )}
            style={{ transitionDelay: "750ms" }}
            >
              <Button
                onClick={handleClose}
                className="w-full rounded-lg bg-ink-800 hover:bg-ink-700 text-white shadow-sm hover:shadow-md transition-all"
              >
                继续
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
