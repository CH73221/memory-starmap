import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { flashcardService } from "@/services/flashcardService"
import { studyPlanService } from "@/services/studyPlanService"
import { achievementService } from "@/services/achievementService"
import type { TodayCardsResponse, Flashcard as FlashcardType, StudyPlan, Achievement } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import ComboDisplay from "@/components/review/ComboDisplay"
import DailyGoalRing from "@/components/review/DailyGoalRing"
import Flashcard from "@/components/review/Flashcard"
import ReviewControls from "@/components/review/ReviewControls"
import ReviewResultScreen from "@/components/review/ReviewResultScreen"
import { AchievementUnlockModal } from "@/components/achievement/AchievementUnlockModal"
import {
  RotateCcw, CheckCircle2, Flame, Clock, Timer, X, Target,
} from "lucide-react"

const DAILY_GOAL_KEY = "memory-starmap:daily-goal"
const KEYBOARD_HINT_KEY = "memory-starmap:keyboard-hint-dismissed"
const DEFAULT_DAILY_GOAL = 20

export default function ReviewPage() {
  const navigate = useNavigate()
  const [todayData, setTodayData] = useState<TodayCardsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<{ quality: number; time: number }[]>([])
  const [cardState, setCardState] = useState<"enter" | "idle" | "exit">("enter")

  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [correctStreak, setCorrectStreak] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL)
  const [timeChallenge, setTimeChallenge] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)

  const [showKeyHint, setShowKeyHint] = useState(false)
  const [showGoalSelector, setShowGoalSelector] = useState(false)
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null)

  const [unlockQueue, setUnlockQueue] = useState<Achievement[]>([])
  const [currentUnlock, setCurrentUnlock] = useState<Achievement | null>(null)

  useEffect(() => { loadToday() }, [])

  useEffect(() => {
    const saved = localStorage.getItem(DAILY_GOAL_KEY)
    if (saved) {
      setDailyGoal(parseInt(saved, 10) || DEFAULT_DAILY_GOAL)
    }
    const dismissed = localStorage.getItem(KEYBOARD_HINT_KEY)
    if (!dismissed) {
      const timer = setTimeout(() => setShowKeyHint(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const plans = await studyPlanService.list()
        const active = plans.find(p => p.status === "active")
        if (active) {
          setActivePlan(active)
          const saved = localStorage.getItem(DAILY_GOAL_KEY)
          if (!saved) {
            setDailyGoal(active.daily_target)
          }
        }
      } catch (e) { console.error(e) }
    }
    loadPlan()
  }, [])

  useEffect(() => {
    if (!currentUnlock && unlockQueue.length > 0) {
      const next = unlockQueue[0]
      setCurrentUnlock(next)
      setUnlockQueue(prev => prev.slice(1))
    }
  }, [currentUnlock, unlockQueue])

  useEffect(() => {
    if (!timeChallenge || completed) return
    if (timeLeft <= 0) { setCompleted(true); fireConfetti(); return }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timeChallenge, timeLeft, completed])

  const loadToday = async () => {
    try {
      const d = await flashcardService.getToday()
      if (d.cards && d.cards.length > 0) {
        const sortedCards = sortCardsByUrgency(d.cards)
        d.cards = sortedCards
      }
      setTodayData(d)
      if (d.cards.length > 0) setStartTime(Date.now())
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const sortCardsByUrgency = (cards: FlashcardType[]): FlashcardType[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return [...cards].sort((a, b) => {
      const aNextReview = (a as any).next_review ? new Date((a as any).next_review) : null
      const bNextReview = (b as any).next_review ? new Date((b as any).next_review) : null
      const aIsNew = !aNextReview || (a as any).repetitions === 0
      const bIsNew = !bNextReview || (b as any).repetitions === 0

      if (aIsNew && bIsNew) return 0
      if (aIsNew) return 1
      if (bIsNew) return -1

      const aIsOverdue = aNextReview! < today
      const bIsOverdue = bNextReview! < today

      if (aIsOverdue && !bIsOverdue) return -1
      if (!aIsOverdue && bIsOverdue) return 1

      return aNextReview!.getTime() - bNextReview!.getTime()
    })
  }

  const isCardOverdue = (card: FlashcardType): boolean => {
    const nextReview = (card as any).next_review
    if (!nextReview) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(nextReview) < today
  }

  const fireConfetti = async () => {
    const { default: confetti } = await import("canvas-confetti")
    const end = Date.now() + 1500
    const colors = ["#1a1a2e", "#c87941", "#5b8c5a", "#b85450"]
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 50, origin: { x: 0, y: 0.7 }, colors })
      confetti({ particleCount: 3, angle: 120, spread: 50, origin: { x: 1, y: 0.7 }, colors })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  const handleFlip = useCallback(() => {
    if (!flipped) setFlipped(true)
  }, [flipped])

  const checkAchievements = useCallback(async () => {
    try {
      await achievementService.getUnlockedAchievements()
    } catch (e) { console.error(e) }
  }, [])

  const handleReview = async (quality: number) => {
    if (!todayData || reviewing) return
    const card = todayData.cards[currentIndex]
    const responseTime = Date.now() - startTime
    setReviewing(true); setCardState("exit")

    try {
      await flashcardService.review(card.id, quality, responseTime)
      const isCorrect = quality >= 3
      setResults(prev => [...prev, { quality, time: responseTime }])

      if (isCorrect) {
        const newCombo = combo + 1
        setCombo(newCombo); setCorrectStreak(v => v + 1); setMaxCombo(v => Math.max(v, newCombo))
        if (newCombo >= 5 && newCombo % 5 === 0) {
          import("canvas-confetti").then(({ default: confetti }) => confetti({ particleCount: 15, spread: 40, origin: { x: 0.5, y: 0.6 }, colors: ["#c87941", "#1a1a2e", "#5b8c5a"] }))
        }
      } else { setCombo(0); setCorrectStreak(0) }

      setTimeout(() => {
        if (currentIndex < todayData.cards.length - 1) {
          setCurrentIndex(i => i + 1); setFlipped(false); setCardState("enter"); setStartTime(Date.now())
          setTimeout(() => setCardState("idle"), 300)
        } else {
          setCompleted(true)
          fireConfetti()
          checkAchievements()
        }
        setReviewing(false)
      }, 250)
    } catch (e) { console.error(e); setCardState("idle"); setReviewing(false) }
  }

  const handlePrevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCardState("exit")
      setTimeout(() => {
        setCurrentIndex(i => i - 1)
        setFlipped(false)
        setCardState("enter")
        setStartTime(Date.now())
        setTimeout(() => setCardState("idle"), 300)
      }, 200)
    }
  }, [currentIndex])

  const handleNextCard = useCallback(() => {
    if (todayData && currentIndex < todayData.cards.length - 1) {
      setCardState("exit")
      setTimeout(() => {
        setCurrentIndex(i => i + 1)
        setFlipped(false)
        setCardState("enter")
        setStartTime(Date.now())
        setTimeout(() => setCardState("idle"), 300)
      }, 200)
    }
  }, [currentIndex, todayData])

  const handleExit = useCallback(() => {
    navigate("/app")
  }, [navigate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed || loading) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault()
        if (!flipped) { handleFlip() }
        return
      }

      if (flipped && !reviewing) {
        const keyNum = parseInt(e.key, 10)
        if (keyNum >= 1 && keyNum <= 6) {
          e.preventDefault()
          handleReview(keyNum - 1)
          return
        }
      }

      if (e.code === "ArrowLeft") { e.preventDefault(); handlePrevCard(); return }
      if (e.code === "ArrowRight") { e.preventDefault(); handleNextCard(); return }
      if (e.code === "Escape") { e.preventDefault(); handleExit(); return }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [flipped, reviewing, completed, loading, handleFlip, handleReview, handlePrevCard, handleNextCard, handleExit])

  const handleRestart = () => {
    setCurrentIndex(0); setFlipped(false); setCompleted(false); setResults([])
    setCardState("enter"); setStartTime(Date.now()); setCombo(0); setMaxCombo(0)
    setCorrectStreak(0); setTimeChallenge(false); setTimeLeft(60); loadToday()
  }

  const handleTimeChallenge = () => {
    setTimeChallenge(true); setTimeLeft(60); setCompleted(false)
    setCurrentIndex(0); setResults([]); setCombo(0); setStartTime(Date.now())
  }

  const handleGoalChange = (goal: number) => {
    setDailyGoal(goal)
    localStorage.setItem(DAILY_GOAL_KEY, goal.toString())
    setShowGoalSelector(false)
  }

  const dismissKeyHint = () => {
    setShowKeyHint(false)
    localStorage.setItem(KEYBOARD_HINT_KEY, "true")
  }

  const queueAchievement = (achievement: Achievement) => {
    setUnlockQueue(prev => [...prev, achievement])
  }

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-8 w-32 mx-auto rounded-md" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  )

  if (!todayData || todayData.cards.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="space-y-6 w-full max-w-lg">
          <div className="text-center">
            <h1 className="text-2xl font-display font-semibold text-ink-800">闪卡复习</h1>
            <p className="text-ink-400 mt-1 text-sm font-sans">通过主动回忆强化记忆</p>
          </div>
          <div className="text-center py-16 bg-white rounded-2xl border border-[var(--border-light)]">
            <div className="w-16 h-16 mx-auto rounded-full bg-ink-50 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-8 h-8 text-ink-800" />
            </div>
            <h3 className="text-xl font-display font-semibold text-ink-800 mb-2">今日已全部完成</h3>
            <p className="text-ink-400 mb-6 text-sm font-sans">{todayData?.new_count ? `${todayData.new_count} 张新卡待学习` : "上传更多笔记来生成新闪卡"}</p>
            <Button
              variant="outline"
              onClick={handleRestart}
              className="rounded-xl h-10 px-5 font-sans text-sm border-ink-800/20 text-ink-700 hover:bg-ink-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> 刷新检查
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <>
        <ReviewResultScreen
          results={results}
          maxCombo={maxCombo}
          onRestart={handleRestart}
          timeChallenge={timeChallenge}
          onTimeChallenge={handleTimeChallenge}
        />
        {currentUnlock && (
          <AchievementUnlockModal
            achievement={currentUnlock}
            open={!!currentUnlock}
            onClose={() => setCurrentUnlock(null)}
          />
        )}
      </>
    )
  }

  const currentCard = todayData.cards[currentIndex]
  const progress = (currentIndex / todayData.cards.length) * 100
  const isOverdue = isCardOverdue(currentCard)

  return (
    <div className="relative min-h-[calc(100vh-8rem)] pb-20 bg-paper">
      {/* ===== 顶部状态栏：简洁白底 ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="text-lg font-display font-semibold text-ink-800">闪卡复习</h1>
            <p className="text-xs text-ink-400 font-sans">通过主动回忆强化记忆</p>
          </div>
          <div className="flex items-center gap-2">
            {timeChallenge && (
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans",
                  timeLeft <= 10 && "animate-pulse"
                )}
                style={{
                  background: timeLeft <= 10 ? "rgba(184,84,80,0.08)" : "rgba(200,121,65,0.08)",
                  color: timeLeft <= 10 ? "#b85450" : "#c87941",
                }}
              >
                <Timer className="w-3.5 h-3.5" />{timeLeft}s
              </div>
            )}
            {correctStreak >= 3 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber/10">
                <Flame className="w-3.5 h-3.5 text-amber" />
                <span className="text-[11px] font-semibold text-amber font-sans">{correctStreak} 连对</span>
              </div>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-xs rounded-lg px-2.5 py-1 font-sans border-[var(--border-light)]",
                isOverdue && "text-amber border-amber/30 bg-amber/5"
              )}
            >
              <Clock className="w-3 h-3 mr-1" /> {currentIndex + 1} / {todayData.cards.length}
              {isOverdue && <span className="ml-1">· 逾期</span>}
            </Badge>
          </div>
        </div>

        {/* 细线进度条 */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-[2px] bg-[var(--border-light)] rounded-full overflow-hidden">
              <div
                className="h-full bg-ink-800 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setShowGoalSelector(!showGoalSelector)}
            className="hover:scale-105 transition-transform cursor-pointer"
            title="点击调整每日目标"
          >
            <DailyGoalRing current={results.length} goal={dailyGoal} />
          </button>
          {showGoalSelector && (
            <div
              className="absolute right-4 top-full mt-2 z-50 rounded-xl shadow-lg p-3 w-44 animate-fade-in bg-white border border-[var(--border-light)]"
            >
              <p className="text-[11px] font-medium text-ink-400 mb-2 px-1 font-sans">每日目标张数</p>
              <div className="space-y-0.5">
                {[10, 20, 30, 50, 100].map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGoalChange(g)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors font-sans",
                      dailyGoal === g
                        ? "bg-ink-800 text-white"
                        : "text-ink-600 hover:bg-ink-50"
                    )}
                  >
                    <Target className="w-3 h-3 inline mr-2" />
                    {g} 张/天
                  </button>
                ))}
              </div>
              {activePlan && (
                <div className="mt-2 pt-2 border-t border-[var(--border-light)]">
                  <p className="text-[10px] text-ink-400 px-1 font-sans">
                    学习计划：{activePlan.daily_target} 张/天
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ComboDisplay combo={combo} />

      <div className="max-w-xl mx-auto relative z-10">
        <Flashcard
          card={currentCard}
          flipped={flipped}
          onFlip={handleFlip}
          cardState={cardState}
          isOverdue={isOverdue}
        />

        {flipped && <ReviewControls onReview={handleReview} disabled={reviewing} />}
      </div>

      {!timeChallenge && results.length === 0 && (
        <div className="text-center animate-fade-in mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setTimeChallenge(true); setTimeLeft(60) }}
            className="text-amber hover:text-amber hover:bg-amber/5 rounded-xl font-sans text-sm"
          >
            <Timer className="w-4 h-4 mr-1.5" /> 开启 60 秒限时挑战
          </Button>
        </div>
      )}

      {/* Keyboard shortcut hint bar */}
      {showKeyHint && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
          <div className="rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3 bg-white border border-[var(--border-light)]">
            <div className="flex items-center gap-2 text-[11px] font-sans text-ink-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-ink-50 text-ink-600 font-mono text-[10px]">空格</kbd>
                <span>翻转</span>
              </span>
              <span className="text-ink-200">|</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-ink-50 text-ink-600 font-mono text-[10px]">1-6</kbd>
                <span>评分</span>
              </span>
              <span className="text-ink-200">|</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-ink-50 text-ink-600 font-mono text-[10px]">Esc</kbd>
                <span>退出</span>
              </span>
            </div>
            <button
              onClick={dismissKeyHint}
              className="p-0.5 rounded hover:bg-ink-50 transition-colors"
              title="关闭提示"
            >
              <X className="w-3.5 h-3.5 text-ink-400" />
            </button>
          </div>
        </div>
      )}

      {currentUnlock && (
        <AchievementUnlockModal
          achievement={currentUnlock}
          open={!!currentUnlock}
          onClose={() => setCurrentUnlock(null)}
        />
      )}
    </div>
  )
}
