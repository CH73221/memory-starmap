import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import type { Flashcard } from "@/types"

interface FlashcardProps {
  card: Flashcard
  flipped: boolean
  onFlip: () => void
  cardState: "enter" | "idle" | "exit"
  isOverdue?: boolean
  memoryStrength?: number
}

function getMemoryStrengthColor(strength: number): string {
  if (strength >= 0.7) return "#5b8c5a"   // 墨绿
  if (strength >= 0.4) return "#c87941"   // 琥珀
  return "#b85450"                        // 暗红
}

function getMemoryStrengthLabel(strength: number): string {
  if (strength >= 0.7) return "强"
  if (strength >= 0.4) return "中"
  return "弱"
}

export default function Flashcard({ card, flipped, onFlip, cardState, isOverdue, memoryStrength }: FlashcardProps) {
  const strength = memoryStrength ?? (card as any).memory_strength
  const strengthPct = typeof strength === "number" ? Math.round(strength * 100) : null
  const strengthColor = strength != null ? getMemoryStrengthColor(strength) : "#6b6b8d"
  const strengthLabel = strength != null ? getMemoryStrengthLabel(strength) : null

  return (
    <motion.div
      initial={cardState === "enter" ? { opacity: 0, y: 20, filter: "blur(8px)", scale: 0.96 } : false}
      animate={{
        opacity: cardState === "exit" ? 0 : 1,
        y: cardState === "enter" ? 0 : cardState === "exit" ? -12 : 0,
        scale: cardState === "enter" ? 1 : cardState === "exit" ? 0.96 : 1,
        filter: cardState === "exit" ? "blur(8px)" : "blur(0px)",
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={cn("flashcard-container cursor-pointer select-none", flipped && "flipped")}
        onClick={onFlip}
        style={{ perspective: "1200px" }}
      >
        <div
          className="flashcard-inner"
          style={{ minHeight: "380px" }}
        >
          {/* ===== 卡片正面：白纸 + 细边框 ===== */}
          <div className="flashcard-front">
            <div
              className={cn(
                "relative w-full h-full rounded-2xl overflow-hidden bg-white",
                isOverdue ? "border-l-[3px] border-l-amber" : "border border-[var(--border-light)]",
              )}
              style={{
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              {/* 记忆强度指示 - 顶部细线 */}
              {strengthPct !== null && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--border-light)]">
                  <div
                    className="h-full transition-all duration-700 ease-out rounded-r-full"
                    style={{
                      width: `${strengthPct}%`,
                      backgroundColor: strengthColor,
                    }}
                  />
                </div>
              )}

              {/* 记忆强度标签 - 右上角 */}
              {strengthPct !== null && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium font-sans"
                    style={{
                      background: `${strengthColor}10`,
                      color: strengthColor,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: strengthColor }}
                    />
                    {strengthLabel} · {strengthPct}%
                  </div>
                </div>
              )}

              {/* 逾期标签 - 左上角 */}
              {isOverdue && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge
                    className="text-[10px] px-2.5 py-1 font-sans font-medium bg-amber/10 text-amber border-amber/30 hover:bg-amber/10"
                    variant="outline"
                  >
                    逾期
                  </Badge>
                </div>
              )}

              {/* 卡片内容区 */}
              <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[380px]">
                {/* 知识点标签 */}
                {card.knowledge_point_title && (
                  <div className="mb-8 px-3 py-1 rounded-md bg-ink-50 text-ink-500">
                    <span className="text-[11px] font-medium font-sans tracking-wide">
                      {card.knowledge_point_title}
                    </span>
                  </div>
                )}

                {/* 问题文字 - Fraunces 大字居中 */}
                <p className="text-2xl md:text-3xl text-center text-ink-800 leading-relaxed font-display font-medium">
                  {card.question}
                </p>

                {/* 点击提示 */}
                <p className="text-xs text-ink-400 mt-10 font-sans tracking-wide">
                  点击卡片查看答案
                </p>
              </div>
            </div>
          </div>

          {/* ===== 卡片背面：白纸答案 ===== */}
          <div className="flashcard-back">
            <div
              className={cn(
                "relative w-full h-full rounded-2xl overflow-hidden bg-white",
                isOverdue ? "border-l-[3px] border-l-amber" : "border border-[var(--border-light)]",
              )}
              style={{
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              {/* 记忆强度 - 顶部细线 */}
              {strengthPct !== null && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--border-light)]">
                  <div
                    className="h-full transition-all duration-700 ease-out rounded-r-full"
                    style={{
                      width: `${strengthPct}%`,
                      backgroundColor: strengthColor,
                    }}
                  />
                </div>
              )}

              {/* 记忆强度 - 右上角 */}
              {strengthPct !== null && (
                <div className="absolute top-4 right-4 z-10">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium font-sans"
                    style={{
                      background: `${strengthColor}10`,
                      color: strengthColor,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: strengthColor }}
                    />
                    {strengthLabel} · {strengthPct}%
                  </div>
                </div>
              )}

              {/* 卡片内容区 */}
              <div className={cn(
                "p-8 md:p-12 flex flex-col items-center justify-center min-h-[380px]",
                flipped && "answer-reveal"
              )}>
                {/* 答案标签 */}
                <div className="mb-8 px-3 py-1 rounded-md bg-amber/10 text-amber">
                  <span className="text-[11px] font-semibold font-sans tracking-widest uppercase">
                    答案
                  </span>
                </div>

                {/* 答案文字 */}
                <p className="text-lg md:text-xl text-center text-ink-700 leading-relaxed font-sans">
                  {card.answer}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
