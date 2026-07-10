import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AnimatedNumber } from "@/components/ui/animated-number"
import {
  RotateCcw, Timer, Check, Award,
} from "lucide-react"

interface ReviewResultScreenProps {
  results: { quality: number; time: number }[]
  maxCombo: number
  onRestart: () => void
  timeChallenge: boolean
  onTimeChallenge: () => void
}

const XP_PER_CORRECT = 10
const COMBO_BONUS_THRESHOLD = 5
const COMBO_BONUS_PER = 2
const LONG_INTERVAL_BONUS = 5

function calculateLevel(xp: number): { level: number; title: string; currentXp: number; nextLevelXp: number; progress: number } {
  let level = 1, xpForCurrent = 0, xpForNext = 100
  while (xp >= xpForNext) { level++; xpForCurrent = xpForNext; xpForNext += level * 100 }
  const progress = xpForNext - xpForCurrent > 0 ? ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100 : 0
  const titles: Record<number, string> = { 1: "初学者", 2: "勤奋学徒", 3: "知识新手", 4: "学习达人", 5: "记忆专家", 6: "学术精英", 7: "学神", 8: "学霸之巅", 9: "知识大师", 10: "传奇学者" }
  return { level, title: titles[Math.min(level, 10)] || "传奇学者", currentXp: xp - xpForCurrent, nextLevelXp: xpForNext - xpForCurrent, progress }
}

export default function ReviewResultScreen({ results, maxCombo, onRestart, timeChallenge, onTimeChallenge }: ReviewResultScreenProps) {
  const correctCount = results.filter((r) => r.quality >= 3).length
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0

  const baseXp = correctCount * XP_PER_CORRECT
  const comboBonus = maxCombo >= COMBO_BONUS_THRESHOLD
    ? Math.floor(maxCombo / COMBO_BONUS_THRESHOLD) * COMBO_BONUS_PER * correctCount
    : 0
  const longIntervalBonus = accuracy >= 90 ? LONG_INTERVAL_BONUS * correctCount : 0
  const totalXp = baseXp + comboBonus + longIntervalBonus

  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    const mockPrevXp = Math.floor(Math.random() * 500) + 100
    const newLvl = calculateLevel(mockPrevXp + totalXp).level
    const prevLvl = calculateLevel(mockPrevXp).level
    if (newLvl > prevLvl) {
      setTimeout(() => setShowLevelUp(true), 600)
    }
  }, [totalXp])

  const stats = [
    { value: results.length, label: "复习卡片" },
    { value: correctCount, label: "回答正确" },
    { value: `${accuracy}%`, label: "正确率" },
    { value: `${maxCombo}×`, label: "最高连击" },
  ]

  const xpBreakdown = [
    { label: "答对奖励", value: baseXp, color: "#1a1a2e" },
    { label: "连击加成", value: comboBonus, color: "#c87941" },
    { label: "高正确率加成", value: longIntervalBonus, color: "#5b8c5a" },
  ]

  const titleText = accuracy >= 90 ? "完美表现" : accuracy >= 70 ? "出色完成" : "继续加油"
  const tipText = accuracy >= 90
    ? "记忆效果极佳，这些知识点已牢固掌握。"
    : accuracy >= 70
    ? "掌握良好，建议明天复习标记为困难的卡片。"
    : "建议稍后重新复习答错的卡片，加深印象。"

  return (
    <div className="min-h-[calc(100vh-8rem)] pb-10 max-w-xl mx-auto">
      {/* 克制的升级提示 */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowLevelUp(false)} />
          <div className="relative bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-lg border border-[var(--border-light)]">
            <div className="w-16 h-16 rounded-full bg-ink-800 flex items-center justify-center mx-auto mb-5">
              <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-display font-semibold text-ink-800 mb-2">
              升级了
            </h3>
            <p className="text-sm text-ink-400 mb-6 font-sans">恭喜你获得新的等级</p>
            <button
              onClick={() => setShowLevelUp(false)}
              className="px-8 py-2.5 rounded-xl bg-ink-800 text-white text-sm font-medium hover:bg-ink-900 transition-colors font-sans"
            >
              继续
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 spring-enter">
        <h1 className="text-2xl font-display font-semibold text-ink-800">复习完成</h1>
        <p className="text-sm text-ink-400 mt-1 font-sans">通过主动回忆强化记忆</p>
      </div>

      <div className="space-y-8">
        {/* 大标题 + Check 图标 */}
        <div className="text-center py-6 spring-enter">
          <div className="w-14 h-14 rounded-full bg-ink-800 flex items-center justify-center mx-auto mb-5">
            <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <h3 className="text-3xl md:text-4xl font-display font-semibold text-ink-800 mb-2">
            {titleText}
          </h3>
          <p className="text-sm text-ink-400 font-sans">你已完成今日闪卡复习</p>
        </div>

        {/* 统计数据：简洁网格 */}
        <div className="grid grid-cols-4 gap-0 divide-x divide-[var(--border-light)] border-y border-[var(--border-light)] py-6">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="stagger-item text-center px-2"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              <p className="text-2xl md:text-3xl font-display font-semibold text-ink-800 tabular-nums">
                {s.value}
              </p>
              <p className="text-[10px] text-ink-400 mt-1.5 uppercase tracking-widest font-sans">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* XP 获得 */}
        <div className="text-center spring-enter" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber star-twinkle" />
            <span className="text-xs font-medium text-ink-500 font-sans tracking-wide">本次获得 XP</span>
          </div>
          <div className="text-5xl font-display font-semibold text-ink-800 tabular-nums memory-count">
            <AnimatedNumber value={totalXp} duration={1200} />
          </div>

          {/* XP 明细 */}
          <div className="mt-5 space-y-0 divide-y divide-[var(--border-light)] border-y border-[var(--border-light)] max-w-xs mx-auto text-left">
            {xpBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3">
                <span className="text-sm text-ink-600 font-sans">{item.label}</span>
                <span className="text-sm font-medium tabular-nums font-sans" style={{ color: item.color }}>
                  +{item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 提示 */}
        <div className="p-4 rounded-xl bg-amber/5 border border-amber/20 spring-enter" style={{ animationDelay: "0.55s" }}>
          <p className="text-sm text-ink-700 font-sans leading-relaxed">{tipText}</p>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3 justify-center flex-wrap spring-enter" style={{ animationDelay: "0.7s" }}>
          <Button
            onClick={onRestart}
            className="h-11 px-6 rounded-xl bg-ink-800 hover:bg-ink-900 text-white font-medium text-sm shadow-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> 再来一轮
          </Button>
          {!timeChallenge && (
            <Button
              variant="outline"
              onClick={onTimeChallenge}
              className="h-11 px-6 rounded-xl border-ink-800/20 text-ink-700 hover:bg-ink-50 font-medium text-sm"
            >
              <Timer className="w-4 h-4 mr-2" /> 限时挑战
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
