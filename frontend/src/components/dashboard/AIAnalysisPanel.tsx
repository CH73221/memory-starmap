import { useState, useEffect } from "react"
import { statsService } from "@/services/statsService"
import type { LearningAnalysis } from "@/types"
import { cn } from "@/lib/utils"
import {
  Brain, TrendingUp, Flame, Target, Star, Sparkles,
  CheckCircle2, AlertTriangle, BookOpen, RefreshCw, Lightbulb, ArrowRight,
} from "lucide-react"

const TYPE_LABELS: Record<string, { label: string; icon: typeof TrendingUp; emoji: string }> = {
  diagnosis:  { label: "学习诊断",  icon: Target,      emoji: "📊" },
  outline:    { label: "学习大纲",  icon: BookOpen,    emoji: "🗺️" },
  key_points: { label: "核心要点",  icon: Star,        emoji: "⭐" },
  weakness:   { label: "薄弱环节",  icon: AlertTriangle, emoji: "🎯" },
}

const ICON_MAP: Record<string, typeof TrendingUp> = {
  "trending-up": TrendingUp, "flame": Flame, "target": Target,
  "star": Star, "sparkles": Sparkles,
}

interface StreamingTextProps { text: string; speed?: number; onComplete?: () => void }

function StreamingText({ text, speed = 20, onComplete }: StreamingTextProps) {
  const [displayed, setDisplayed] = useState("")
  const [idx, setIdx] = useState(0)

  useEffect(() => { setDisplayed(""); setIdx(0) }, [text])

  useEffect(() => {
    if (idx < text.length) {
      const timer = setTimeout(() => { setDisplayed(prev => prev + text[idx]); setIdx(prev => prev + 1) }, speed)
      return () => clearTimeout(timer)
    } else if (onComplete) onComplete()
  }, [idx, text, speed])

  return <span>{displayed}{idx < text.length && <span className="typing-dot" />}</span>
}

function ThinkingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      {/* 简洁的思考指示 - 无发光球体 */}
      <div className="w-12 h-12 rounded-full border border-[var(--border)] flex items-center justify-center">
        <Brain className="w-5 h-5 text-ink-500" />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-ink-500 font-sans mb-2">AI 正在分析你的学习数据</p>
        <div className="flex items-center justify-center gap-1.5">
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
        </div>
      </div>

      <div className="w-full max-w-xs space-y-2.5">
        {["读取学习数据", "分析知识掌握度", "生成个性化建议"].map((step, i) => (
          <div key={i} className="flex items-center gap-2.5" style={{ animationDelay: `${i * 600}ms` }}>
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border",
              i < 2 ? "border-ink-800 bg-ink-800" : "border-[var(--border)] bg-transparent"
            )}>
              {i < 2
                ? <CheckCircle2 className="w-3 h-3 text-white" />
                : <div className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse" />}
            </div>
            <span className={cn(
              "text-xs font-sans",
              i < 2 ? "text-ink-400" : "text-ink-600"
            )}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalysisContent({ data, onRefresh, loading }: { data: LearningAnalysis; onRefresh: () => void; loading: boolean }) {
  const [contentDone, setContentDone] = useState(false)
  useEffect(() => { setContentDone(false) }, [data.content])

  return (
    <div className="space-y-6 answer-reveal">
      <div>
        <p className="text-sm text-ink-600 leading-relaxed font-sans">
          <StreamingText text={data.content} speed={15} onComplete={() => setContentDone(true)} />
        </p>
      </div>

      {contentDone && data.highlights && data.highlights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 border-t border-[var(--border-light)]">
          {data.highlights.map((h, i) => {
            const Icon = ICON_MAP[h.icon] || Sparkles
            return (
              <div key={i} className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--border-light)] bg-paper-50">
                <div className="w-8 h-8 rounded-md bg-ink-50 border border-[var(--border-light)] flex items-center justify-center text-ink-600 shrink-0">
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <span className="text-xs font-medium text-ink-600 leading-snug font-sans">{h.text}</span>
              </div>
            )
          })}
        </div>
      )}

      {contentDone && data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[var(--border-light)]">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-400 uppercase tracking-wider font-sans">
            <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.75} /> AI 建议
          </div>
          {data.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-3 py-3">
              <div className="w-6 h-6 rounded-full bg-ink-800 flex items-center justify-center text-white text-[10px] font-bold shrink-0 font-sans mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-800 mb-1 font-sans">{r.title}</p>
                <p className="text-xs text-ink-400 leading-relaxed font-sans">{r.description}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-ink-300 shrink-0 mt-1.5" strokeWidth={1.75} />
            </div>
          ))}
        </div>
      )}

      {contentDone && (
        <div className="pt-4 border-t border-[var(--border-light)] flex items-center justify-between">
          <p className="text-[11px] text-ink-400 flex items-center gap-1 font-sans">
            <Sparkles className="w-3 h-3" strokeWidth={1.75} /> 基于最近 7 天学习数据
          </p>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs text-ink-600 hover:text-ink-800 font-medium disabled:opacity-50 transition-colors flex items-center gap-1 font-sans"
          >
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} strokeWidth={1.75} /> 重新生成
          </button>
        </div>
      )}
    </div>
  )
}

interface Props { className?: string }

export function AIAnalysisPanel({ className }: Props) {
  const [activeTab, setActiveTab] = useState("diagnosis")
  const [data, setData] = useState<Record<string, LearningAnalysis | null>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => { if (!data[activeTab] && !loading[activeTab]) fetchAnalysis(activeTab) }, [activeTab])

  const fetchAnalysis = async (type: string) => {
    setLoading(prev => ({ ...prev, [type]: true }))
    try {
      const result = await statsService.getLearningAnalysis(type)
      setData(prev => ({ ...prev, [type]: result }))
    } catch {
      setData(prev => ({ ...prev, [type]: { type, title: TYPE_LABELS[type]?.label || "AI 分析", content: "AI 服务暂时不可用，请稍后再试。", highlights: [], recommendations: [] } }))
    } finally { setLoading(prev => ({ ...prev, [type]: false })); setInitialLoading(false) }
  }

  const renderTabContent = (type: string) => {
    if ((loading[type] || initialLoading) && !data[type]) return <ThinkingAnimation />
    const item = data[type]
    if (!item) return <ThinkingAnimation />
    return <AnalysisContent data={item} onRefresh={() => fetchAnalysis(type)} loading={!!loading[type]} />
  }

  return (
    <div className={cn("hover-lift bg-white border border-[var(--border-light)] rounded-xl", className)}>
      {/* 头部 - 简洁标题区，无渐变 */}
      <div className="p-5 border-b border-[var(--border-light)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-ink-800 flex items-center gap-2">
                AI 智能分析
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold font-sans tracking-wide border border-amber-200">BETA</span>
              </h3>
              <p className="text-xs text-ink-400 mt-0.5 font-sans">基于你的学习数据生成个性化建议</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 切换 - 简洁下划线风格 */}
      <div className="px-5 pt-4">
        <div className="flex gap-0 border-b border-[var(--border-light)]">
          {Object.entries(TYPE_LABELS).map(([key, meta]) => {
            const isActive = activeTab === key
            const Icon = meta.icon
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium font-sans transition-colors -mb-px border-b-2",
                  isActive
                    ? "border-ink-800 text-ink-800"
                    : "border-transparent text-ink-400 hover:text-ink-600 hover:border-ink-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">{meta.label}</span>
                <span className="sm:hidden">{meta.emoji}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 内容区 */}
      <div className="blur-enter p-5" key={activeTab}>
        {renderTabContent(activeTab)}
      </div>
    </div>
  )
}
