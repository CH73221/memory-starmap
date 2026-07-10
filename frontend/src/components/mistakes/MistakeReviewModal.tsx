import { useState, useEffect, useCallback } from "react"
import { mistakeService } from "@/services/extraService"
import type { MistakeReviewItem } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AnimatedNumber } from "@/components/ui/animated-number"
import {
  X, Brain, Target, CheckCircle2, HelpCircle, AlertTriangle,
  Sparkles, RotateCcw, Trophy, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MistakeReviewModalProps {
  open: boolean
  onClose: () => void
  onComplete?: () => void
}

type QualityType = "forgot" | "vague" | "remembered"

interface ReviewSessionStats {
  total: number
  correctCount: number
  newlyResolved: number
}

const DIAGNOSIS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  memory_decay: { label: "记忆衰减", color: "text-amber", bg: "bg-amber-50", border: "border-amber/30" },
  concept_misunderstanding: { label: "概念误解", color: "text-error", bg: "bg-error-bg", border: "border-error/30" },
  careless: { label: "粗心失误", color: "text-ink-600", bg: "bg-ink-50", border: "border-ink-300/30" },
  unknown: { label: "其他", color: "text-ink-500", bg: "bg-paper-100", border: "border-border" },
}

const qualityButtons: { quality: QualityType; label: string; emoji: string; border: string; hover: string; text: string; bg: string; qualityNum: number }[] = [
  { quality: "forgot", label: "还不会", emoji: "😵", border: "border-error", hover: "hover:bg-error-bg", text: "text-error", bg: "bg-error-bg", qualityNum: 0 },
  { quality: "vague", label: "有点印象", emoji: "🤔", border: "border-amber", hover: "hover:bg-amber-50", text: "text-amber", bg: "bg-amber-50", qualityNum: 2 },
  { quality: "remembered", label: "记住了", emoji: "✅", border: "border-success", hover: "hover:bg-success-bg", text: "text-success", bg: "bg-success-bg", qualityNum: 4 },
]

export default function MistakeReviewModal({ open, onClose, onComplete }: MistakeReviewModalProps) {
  const [items, setItems] = useState<MistakeReviewItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [cardState, setCardState] = useState<"enter" | "idle" | "exit">("idle")
  const [finished, setFinished] = useState(false)
  const [stats, setStats] = useState<ReviewSessionStats>({ total: 0, correctCount: 0, newlyResolved: 0 })
  const [sessionResults, setSessionResults] = useState<{ id: number; quality: number; resolved: boolean }[]>([])

  const loadReviewList = useCallback(async () => {
    setLoading(true)
    setShowAnswer(false)
    setCurrentIndex(0)
    setFinished(false)
    setSessionResults([])
    try {
      const data = await mistakeService.getReviewList()
      setItems(data)
      setStats({ total: data.length, correctCount: 0, newlyResolved: 0 })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadReviewList()
    }
  }, [open, loadReviewList])

  const currentItem = items[currentIndex]
  const progress = items.length > 0 ? ((currentIndex + (showAnswer ? 0.5 : 0)) / items.length) * 100 : 0

  const handleShowAnswer = () => {
    setShowAnswer(true)
  }

  const handleQuality = async (quality: QualityType, qualityNum: number) => {
    if (!currentItem) return

    try {
      const result = await mistakeService.reviewMistake(currentItem.id, qualityNum)
      const wasResolvedBefore = currentItem.correct_count >= 2
      const nowResolved = result.resolved

      setSessionResults((prev) => [...prev, { id: currentItem.id, quality: qualityNum, resolved: result.resolved }])
      setStats((prev) => ({
        ...prev,
        correctCount: prev.correctCount + (qualityNum >= 3 ? 1 : 0),
        newlyResolved: prev.newlyResolved + (!wasResolvedBefore && nowResolved ? 1 : 0),
      }))

      // Animate out
      setCardState("exit")
      setTimeout(() => {
        if (currentIndex >= items.length - 1) {
          setFinished(true)
          if (stats.newlyResolved + (!wasResolvedBefore && nowResolved ? 1 : 0) > 0) {
            import("canvas-confetti").then(({ default: confetti }) => confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }))
          }
        } else {
          setCurrentIndex((prev) => prev + 1)
          setShowAnswer(false)
          setCardState("enter")
          setTimeout(() => setCardState("idle"), 300)
        }
      }, 250)
    } catch (e) {
      console.error(e)
    }
  }

  const handleRestart = () => {
    loadReviewList()
  }

  const handleClose = () => {
    onClose()
    if (finished && onComplete) {
      onComplete()
    }
  }

  if (!open) return null

  const accuracy = stats.total > 0 ? Math.round((stats.correctCount / stats.total) * 100) : 0
  const diagnosisMeta = currentItem ? (DIAGNOSIS_META[currentItem.diagnosis] || DIAGNOSIS_META.unknown) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ink-50 border border-border flex items-center justify-center">
              <Target className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-800 font-display">错题专项复习</h2>
              <p className="text-xs text-ink-500">
                {loading ? "加载中..." : finished ? "复习完成" : `第 ${currentIndex + 1} 题 / 共 ${items.length} 题`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-lg bg-white border border-border hover:bg-paper-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-ink-600" />
          </button>
        </div>

        {/* Progress bar */}
        {!loading && !finished && items.length > 0 && (
          <div className="mb-4 px-2">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 flex items-center justify-center">
          {loading ? (
            <div className="text-ink-500 text-center">
              <div className="w-12 h-12 border-2 border-paper-300 border-t-ink-700 rounded-full animate-spin mx-auto mb-4" />
              <p>正在加载错题...</p>
            </div>
          ) : finished ? (
            /* Result Screen */
            <div className="w-full animate-fade-in">
              <Card className="text-center py-10 bg-white border-border shadow-md overflow-hidden">
                <CardContent>
                  <div className="relative mb-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border border-amber/20 flex items-center justify-center">
                      <Trophy className="w-10 h-10 text-amber" />
                    </div>
                    {stats.newlyResolved > 0 && (
                      <div className="absolute top-0 right-1/4 px-3 py-1 rounded-full bg-success text-white text-xs font-bold shadow-sm">
                        新解决 {stats.newlyResolved} 题
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-extrabold text-ink-800 mb-2 font-display">
                    {accuracy >= 80 ? "表现出色！" : accuracy >= 50 ? "继续加油！" : "多复习几遍！"}
                  </h3>
                  <p className="text-ink-500 mb-6 text-sm">
                    {stats.newlyResolved > 0
                      ? `本次成功解决了 ${stats.newlyResolved} 道错题`
                      : "坚持复习，错题会越来越少"}
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
                    <div className="p-4 rounded-lg bg-white border border-border animate-fade-in" style={{ animationDelay: "100ms" }}>
                      <p className="text-2xl font-extrabold text-ink-800 font-display">
                        <AnimatedNumber value={stats.total} duration={600} />
                      </p>
                      <p className="text-xs text-ink-500 mt-1">复习题数</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white border border-border animate-fade-in" style={{ animationDelay: "200ms" }}>
                      <p className="text-2xl font-extrabold text-success font-display">
                        <AnimatedNumber value={accuracy} duration={600} delay={100} suffix="%" />
                      </p>
                      <p className="text-xs text-ink-500 mt-1">答对率</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white border border-border animate-fade-in" style={{ animationDelay: "300ms" }}>
                      <p className="text-2xl font-extrabold text-amber font-display">
                        <AnimatedNumber value={stats.newlyResolved} duration={600} delay={200} />
                      </p>
                      <p className="text-xs text-ink-500 mt-1">新解决</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-50 border border-amber/20 mb-6 max-w-md mx-auto">
                    <p className="text-xs text-amber font-medium flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {accuracy >= 80
                        ? "错题掌握得很好！继续保持"
                        : accuracy >= 50
                        ? "建议明天再复习一次答错的题目"
                        : "建议立即重新复习一遍，加深印象"}
                    </p>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="amber"
                      onClick={handleRestart}
                      className="rounded-lg"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" /> 再来一轮
                    </Button>
                    <Button variant="outline" onClick={handleClose} className="rounded-lg">
                      返回错题本
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : items.length === 0 ? (
            /* Empty state */
            <Card className="text-center py-16 bg-white border-border w-full max-w-md">
              <CardContent>
                <CheckCircle2 className="w-14 h-14 mx-auto text-ink-300 mb-4" />
                <h3 className="text-lg font-semibold text-ink-800 mb-2 font-display">没有待复习的错题</h3>
                <p className="text-ink-500 mb-6 text-sm">所有未解决的错题都已掌握，或暂无错题</p>
                <Button variant="outline" onClick={handleClose} className="rounded-lg">
                  返回错题本
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Review card */
            <div
              className="w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                opacity: cardState === "exit" ? 0 : 1,
                transform: cardState === "enter" ? "translateX(24px)" : cardState === "exit" ? "translateX(-24px)" : "translateX(0)",
              }}
            >
              <Card className={cn(
                "bg-white border-border shadow-md overflow-hidden relative",
              )}>
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber" />

                <CardContent className="p-6 md:p-8">
                  {/* Meta row */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {diagnosisMeta && (
                        <Badge variant="outline" className={cn("rounded-md text-[10px] font-bold", diagnosisMeta.color, diagnosisMeta.bg, diagnosisMeta.border, "border")}>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {diagnosisMeta.label}
                        </Badge>
                      )}
                      <Badge variant="default" className="rounded-md text-[10px] font-bold">
                        答对 {currentItem.correct_count}/2
                      </Badge>
                    </div>
                    <span className="text-xs text-ink-400 font-medium">
                      第 {currentIndex + 1} / {items.length} 题
                    </span>
                  </div>

                  {/* Question */}
                  <div className="mb-6">
                    <p className="text-xs text-ink-500 font-medium mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> 问题
                    </p>
                    <p className="text-lg md:text-xl text-ink-800 leading-relaxed font-medium font-display">
                      {currentItem.question}
                    </p>
                  </div>

                  {/* Answer section */}
                  {showAnswer ? (
                    <div className="animate-slide-up">
                      <div className="p-4 rounded-lg bg-success-bg border border-success/20 mb-4">
                        <p className="text-[10px] text-success font-bold uppercase mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 正确答案
                        </p>
                        <p className="text-base text-ink-800 leading-relaxed">{currentItem.answer}</p>
                      </div>

                      {/* AI explanation */}
                      {currentItem.ai_explanation && (
                        <div className="p-4 rounded-lg bg-ink-50 border-l-2 border-ink-300 mb-6">
                          <p className="text-[10px] text-ink-700 font-bold uppercase mb-1.5 flex items-center gap-1.5">
                            <Brain className="w-3.5 h-3.5" /> AI 解析
                          </p>
                          <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">
                            {currentItem.ai_explanation}
                          </p>
                        </div>
                      )}

                      {/* Quality buttons */}
                      <div className="mt-5">
                        <p className="text-center text-sm text-ink-500 mb-3">你觉得这道题掌握得如何？</p>
                        <div className="grid grid-cols-3 gap-2">
                          {qualityButtons.map((b) => (
                            <Button
                              key={b.quality}
                              variant="outline"
                              className={cn(
                                "h-auto py-3 flex-col gap-1.5 rounded-lg border-2 bg-white",
                                b.border,
                                b.hover,
                                "active:scale-95 transition-all duration-150",
                              )}
                              onClick={() => handleQuality(b.quality, b.qualityNum)}
                            >
                              <span className="text-xl leading-none">{b.emoji}</span>
                              <span className={cn("text-sm font-semibold", b.text)}>{b.label}</span>
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", b.bg, b.text)}>
                                {b.qualityNum >= 3 ? "答对" : "未答对"}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Show answer button */
                    <div className="text-center">
                      <Button
                        variant="amber"
                        onClick={handleShowAnswer}
                        className="rounded-lg px-8"
                      >
                        <Sparkles className="w-4 h-4 mr-2" /> 显示答案
                      </Button>
                      <p className="text-xs text-ink-400 mt-3">先试着回忆答案，再点击查看</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
