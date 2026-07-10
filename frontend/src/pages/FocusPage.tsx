import { useRef, useEffect, useState, useCallback } from "react"
import { focusService } from "@/services/extraService"
import type { FocusStatsResponse, FocusSession } from "@/services/extraService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FadeIn } from "@/components/ui/page-transition"
import { useWebAudio } from "@/hooks/useWebAudio"
import type { AmbientType } from "@/hooks/useWebAudio"
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Coffee, Trees, CloudRain, Wind,
  Trophy, Target, Clock, Zap, Flame,
} from "lucide-react"
import { cn } from "@/lib/utils"

const DURATION_OPTIONS = [
  { minutes: 25, label: "标准番茄", desc: "深度专注", icon: "🍅" },
  { minutes: 5, label: "短休息", desc: "短暂恢复", icon: "☕" },
  { minutes: 15, label: "长休息", desc: "充分放松", icon: "🌿" },
  { minutes: 45, label: "深度工作", desc: "长时间沉浸", icon: "🚀" },
]

const AMBIENT_OPTIONS: { type: AmbientType; label: string; icon: typeof CloudRain }[] = [
  { type: "none", label: "静音", icon: VolumeX },
  { type: "rain", label: "雨声", icon: CloudRain },
  { type: "forest", label: "森林", icon: Trees },
  { type: "cafe", label: "咖啡馆", icon: Coffee },
  { type: "white", label: "白噪音", icon: Wind },
]

export default function FocusPage() {
  const [duration, setDuration] = useState(25)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [ambientType, setAmbientType] = useState<AmbientType>("rain")
  const [stats, setStats] = useState<FocusStatsResponse | null>(null)
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<number | null>(null)
  const startedAtRef = useRef<number>(0)

  const { isPlaying, volume, play, stop: stopAudio, setVolume } = useWebAudio()

  const load = useCallback(async () => {
    try {
      const [s, list] = await Promise.all([focusService.stats(), focusService.list(20)])
      setStats(s)
      setSessions(list)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleStart = () => {
    startedAtRef.current = Date.now()
    setTimeLeft(duration * 60)
    setRunning(true)
    if (ambientType !== "none") play(ambientType)
  }

  const handlePause = () => {
    setRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const handleResume = () => {
    setRunning(true)
  }

  const handleReset = () => {
    handlePause()
    stopAudio()
    setTimeLeft(duration * 60)
  }

  const handleComplete = useCallback(async () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    stopAudio()
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 }, colors: ["#1a1a2e", "#c87941", "#6b6b8d", "#25253d"] })
    })

    const xp = Math.round(duration * 4)
    try {
      await focusService.create({
        duration_minutes: duration,
        ambient_sound: ambientType,
        completed: true,
        xp_earned: xp,
      })
      load()
    } catch (e) { console.error(e) }
  }, [duration, ambientType, load, stopAudio])

  // Timer
  useEffect(() => {
    if (!running) return
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleComplete()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running, handleComplete])

  // 当选择不同时长时重置
  useEffect(() => {
    if (!running) setTimeLeft(duration * 60)
  }, [duration, running])

  const handleAmbientChange = (type: AmbientType) => {
    setAmbientType(type)
    if (type === "none") {
      stopAudio()
    } else if (running) {
      play(type)
    }
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (progress / 100) * circumference

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full max-w-2xl mx-auto rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-display font-bold text-ink-800 flex items-center gap-2">
            <Target className="w-7 h-7 text-ink-700" />
            专注模式
          </h1>
          <p className="text-sm text-ink-400 mt-1">番茄钟 · 白噪声 · 沉浸式学习</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer - 白纸 */}
        <FadeIn delay={100} className="lg:col-span-2">
          <Card>
            <CardContent className="p-8">
              {/* Duration Selector */}
              <div className="flex flex-wrap gap-2 mb-8">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.minutes}
                    onClick={() => { if (!running) setDuration(d.minutes) }}
                    disabled={running}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border",
                      duration === d.minutes
                        ? "bg-ink-800 text-white border-ink-800"
                        : "bg-white text-ink-600 border-gray-200 hover:border-ink-300 hover:text-ink-800",
                      running && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span>{d.icon}</span>
                    <div className="text-left">
                      <div>{d.label}</div>
                      <div className="text-[10px] opacity-75">{d.minutes}分钟 · {d.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Timer Ring - 墨蓝细圈 */}
              <div className="flex items-center justify-center my-10">
                <div className="relative">
                  {/* 进行中状态指示：琥珀色小 pulse 点 */}
                  {running && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
                      <span className="text-xs font-medium text-amber">专注中</span>
                    </div>
                  )}
                  <svg width="300" height="300" className="transform -rotate-90">
                    {/* 背景环 */}
                    <circle
                      cx="150"
                      cy="150"
                      r={radius}
                      fill="none"
                      stroke="#e8e8f0"
                      strokeWidth="8"
                    />
                    {/* 进度环 - ink-800 纯色 */}
                    <circle
                      cx="150"
                      cy="150"
                      r={radius}
                      fill="none"
                      stroke="#1a1a2e"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  {/* 计时器文字 - Fraunces 超大字体 ink-800，无渐变无发光 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p
                      className="font-display font-bold tabular-nums tracking-tighter text-ink-800"
                      style={{
                        fontSize: "clamp(3rem, 10vw, 5.5rem)",
                        lineHeight: 1,
                      }}
                    >
                      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </p>
                    <p className="text-sm text-ink-400 mt-4 font-medium">
                      {running ? "专注中..." : timeLeft === duration * 60 ? "准备开始" : "已暂停"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Controls - 圆形白底按钮 */}
              <div className="flex items-center justify-center gap-4">
                {!running ? (
                  <Button
                    onClick={timeLeft < duration * 60 ? handleResume : handleStart}
                    className="rounded-full px-10 py-6 text-base bg-ink-800 hover:bg-ink-700 text-white shadow-sm hover:shadow-md transition-all border-0 font-semibold"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {timeLeft < duration * 60 ? "继续" : "开始专注"}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    className="rounded-full px-10 py-6 text-base bg-amber hover:bg-amber/90 text-white shadow-sm hover:shadow-md transition-all border-0 font-semibold"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    暂停
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="rounded-full w-14 h-14 p-0 bg-white border-gray-200 text-ink-500 hover:bg-ink-50 hover:text-ink-800 hover:border-ink-300 transition-all shadow-sm"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Side: Ambient + Stats - 白纸卡片 */}
        <div className="space-y-4">
          <FadeIn delay={200}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-ink-700" />
                  白噪声
                </CardTitle>
                <CardDescription>选择适合的环境音</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {AMBIENT_OPTIONS.map((a) => {
                    const Icon = a.icon
                    return (
                      <button
                        key={a.type}
                        onClick={() => handleAmbientChange(a.type)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border",
                          ambientType === a.type
                            ? "bg-ink-800 text-white border-ink-800"
                            : "bg-white text-ink-600 border-gray-200 hover:border-ink-300 hover:text-ink-800"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {a.label}
                      </button>
                    )
                  })}
                </div>
                {ambientType !== "none" && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-ink-400">音量</span>
                      <span className="text-xs text-ink-400">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-ink-800"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={300}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber" />
                  今日专注
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-paper-50 border border-gray-200">
                    <p className="text-xs text-ink-400 font-medium">时长</p>
                    <p className="text-2xl font-display font-bold text-ink-800 mt-0.5">{stats?.today_minutes || 0}<span className="text-xs text-ink-400 ml-0.5">分</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-paper-50 border border-gray-200">
                    <p className="text-xs text-ink-400 font-medium">番茄</p>
                    <p className="text-2xl font-display font-bold text-ink-800 mt-0.5">{stats?.today_sessions || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-paper-50 border border-gray-200">
                    <p className="text-xs text-ink-400 font-medium">连续</p>
                    <p className="text-2xl font-display font-bold text-ink-800 mt-0.5">{stats?.longest_streak_days || 0}<span className="text-xs text-ink-400 ml-0.5">天</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-paper-50 border border-gray-200">
                    <p className="text-xs text-ink-400 font-medium">总XP</p>
                    <p className="text-2xl font-display font-bold text-amber mt-0.5">{stats?.total_xp || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>

      {/* Recent sessions - 简洁列表，分割线分隔 */}
      {sessions.length > 0 && (
        <FadeIn delay={400}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink-500" />
                专注记录
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {sessions.slice(0, 8).map((s) => {
                  const meta = AMBIENT_OPTIONS.find(a => a.type === s.ambient_sound)
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-paper-50 transition-colors"
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        s.completed
                          ? "bg-ink-50 border border-ink-200"
                          : "bg-paper-100 border border-paper-200"
                      )}>
                        {s.completed
                          ? <Zap className="w-4 h-4 text-ink-700" />
                          : <Clock className="w-4 h-4 text-ink-300" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-800">{s.duration_minutes} 分钟专注</p>
                        <p className="text-xs text-ink-400">{new Date(s.started_at).toLocaleString("zh-CN")} · {meta?.label || "无环境音"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-amber">+{s.xp_earned} XP</p>
                        <p className="text-[10px] text-ink-400">{s.completed ? "已完成" : "未完成"}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}
