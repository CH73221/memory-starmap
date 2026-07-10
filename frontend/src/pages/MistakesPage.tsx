import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { mistakeService } from "@/services/extraService"
import type { Mistake, MistakeListResponse, WeaknessRadarResponse } from "@/services/extraService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FadeIn } from "@/components/ui/page-transition"
import MistakeReviewModal from "@/components/mistakes/MistakeReviewModal"
import {
  AlertTriangle, Brain, CheckCircle2, ChevronDown, ChevronUp, Clock,
  Lightbulb, RefreshCw, RotateCcw, Sparkles, Target, Trash2, XCircle, Zap,
} from "lucide-react"
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts"
import { cn } from "@/lib/utils"

const DIAGNOSIS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Clock; variant: string }> = {
  memory_decay: { label: "记忆衰减", color: "text-amber", bg: "bg-amber-50", border: "border-amber/30", icon: Clock, variant: "amber" },
  concept_misunderstanding: { label: "概念误解", color: "text-error", bg: "bg-error-bg", border: "border-error/30", icon: AlertTriangle, variant: "destructive" },
  careless: { label: "粗心失误", color: "text-ink-600", bg: "bg-ink-50", border: "border-ink-300/30", icon: Zap, variant: "default" },
  unknown: { label: "其他", color: "text-ink-500", bg: "bg-paper-100", border: "border-border", icon: Brain, variant: "secondary" },
}

export default function MistakesPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<MistakeListResponse | null>(null)
  const [radar, setRadar] = useState<WeaknessRadarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [includeResolved, setIncludeResolved] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  const load = async () => {
    try {
      const [d, r] = await Promise.all([
        mistakeService.list(includeResolved),
        mistakeService.weaknessRadar(),
      ])
      setData(d)
      setRadar(r)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [includeResolved])

  const handleResolve = async (id: number) => {
    try {
      await mistakeService.resolve(id)
      import("canvas-confetti").then(({ default: confetti }) => confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } }))
      load()
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除此错题？")) return
    try {
      await mistakeService.delete(id)
      load()
    } catch (e) { console.error(e) }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    )
  }

  const byDiagnosis = data?.by_diagnosis || {}
  const diagnosisChartData = Object.entries(byDiagnosis).map(([k, v]) => ({
    name: DIAGNOSIS_META[k]?.label || k,
    value: v,
  }))

  // Radar chart data
  const radarData = radar?.labels.map((label, i) => ({
    subject: label,
    value: radar.counts[i],
  })) || []

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold font-display text-ink-800 flex items-center gap-2">
              <Target className="w-7 h-7 text-amber" />
              错题本
            </h1>
            <p className="text-ink-500 mt-1 font-sans text-sm">
              AI 诊断每个错误，帮你精准定位薄弱环节
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="amber"
              onClick={() => setReviewModalOpen(true)}
              disabled={!data || data.unresolved === 0}
              className="rounded-lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              错题重练
              {data && data.unresolved > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">
                  {data.unresolved}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={load} className="rounded-lg">
              <RefreshCw className="w-4 h-4 mr-2" /> 刷新
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Stats Overview */}
      <FadeIn delay={100}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-500 font-medium">总错题</p>
                  <p className="text-3xl font-extrabold text-ink-800 mt-1 font-display">{data?.total || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-ink-50 border border-border flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-ink-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-500 font-medium">未解决</p>
                  <p className="text-3xl font-extrabold text-error mt-1 font-display">{data?.unresolved || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-error-bg border border-error/20 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-error" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-500 font-medium">薄弱知识点</p>
                  <p className="text-3xl font-extrabold text-amber mt-1 font-display">{radar?.labels.length || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber/20 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-amber" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-500 font-medium">已解决率</p>
                  <p className="text-3xl font-extrabold text-success mt-1 font-display">
                    {data && data.total > 0 ? Math.round((data.total - data.unresolved) / data.total * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-success-bg border border-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn delay={200}>
          <Card className="bg-white border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-ink-800 font-display">
                <Lightbulb className="w-5 h-5 text-amber" />
                错因分布
              </CardTitle>
              <CardDescription className="text-ink-500">AI 自动诊断的错误类型</CardDescription>
            </CardHeader>
            <CardContent>
              {diagnosisChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={diagnosisChartData}>
                    <defs>
                      <linearGradient id="diagGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c87941" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#c87941" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="#ebe8e3" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} stroke="#6b6b8d" tickLine={false} />
                    <YAxis fontSize={11} stroke="#6b6b8d" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #ddd8d1", background: "#fff", color: "#1a1a2e", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                    <Area type="monotone" dataKey="value" stroke="#c87941" strokeWidth={2} fill="url(#diagGrad)" dot={{ r: 4, fill: "#c87941", strokeWidth: 2, stroke: "#fff" }} animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-ink-400">还没有错题数据</div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={300}>
          <Card className="bg-white border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-ink-800 font-display">
                <Sparkles className="w-5 h-5 text-ink-700" />
                薄弱点雷达
              </CardTitle>
              <CardDescription className="text-ink-500">错题聚合出的高频知识缺口</CardDescription>
            </CardHeader>
            <CardContent>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#ddd8d1" />
                    <PolarAngleAxis dataKey="subject" fontSize={10} tick={{ fill: "#4a4a6a", fontWeight: 500 }} />
                    <PolarRadiusAxis domain={[0, Math.max(...radarData.map(d => d.value))]} fontSize={9} tick={{ fill: "#6b6b8d" }} />
                    <Radar dataKey="value" stroke="#1a1a2e" fill="#1a1a2e" fillOpacity={0.1} strokeWidth={2} dot={{ r: 3, fill: "#c87941", strokeWidth: 2, stroke: "#fff" }} animationDuration={1500} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #ddd8d1", background: "#fff", color: "#1a1a2e", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-ink-400 text-sm">
                  完成一些错题后<br/>解锁薄弱点雷达
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Tabs */}
      <FadeIn delay={400}>
        <div className="flex items-center justify-between gap-3">
          <Tabs value={includeResolved ? "all" : "active"} onValueChange={(v) => setIncludeResolved(v === "all")}>
            <TabsList className="bg-transparent border-b border-border p-0 h-auto gap-0 rounded-none">
              <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-ink-700 data-[state=active]:text-ink-800 text-ink-500 px-4 py-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-ink-700">未解决 ({data?.unresolved || 0})</TabsTrigger>
              <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-ink-700 data-[state=active]:text-ink-800 text-ink-500 px-4 py-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-ink-700">全部</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </FadeIn>

      {/* Mistakes list */}
      {!data || data.items.length === 0 ? (
        <FadeIn delay={500}>
          <Card className="text-center py-16 border-dashed border-paper-300 bg-white">
            <CardContent>
              <CheckCircle2 className="w-14 h-14 mx-auto text-ink-300 mb-4" />
              <h3 className="text-lg font-semibold text-ink-800 mb-2 font-display">
                {includeResolved ? "还没有错题记录" : "没有未解决的错题"}
              </h3>
              <p className="text-ink-500 mb-6 text-sm">
                {includeResolved ? "去闪卡复习页面开始学习，错题会自动记录" : "继续保持，答错的题目会自动入错题本"}
              </p>
              <Button asChild className="rounded-lg">
                <button onClick={() => navigate('/app/review')}>开始复习</button>
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <div className="space-y-3 stagger-children">
          {data.items.map((m) => {
            const meta = DIAGNOSIS_META[m.diagnosis] || DIAGNOSIS_META.unknown
            const Icon = meta.icon
            const isExpanded = expandedId === m.id
            return (
              <Card key={m.id} className={cn(
                "bg-white border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden",
                m.resolved && "opacity-60"
              )}>
                {/* Left accent bar */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-[3px]",
                  m.resolved
                    ? "bg-success"
                    : "bg-amber"
                )} />
                <CardContent className="p-5 pl-6">
                  <div className="flex items-start gap-4">
                    {/* Diagnosis icon */}
                    <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center shrink-0", meta.bg, "border", meta.border)}>
                      <Icon className={cn("w-5 h-5", meta.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className={cn("rounded-md text-[10px] font-bold", meta.color, meta.bg, meta.border, "border")}>
                          {meta.label}
                        </Badge>
                        {m.resolved && <Badge variant="success" className="rounded-md text-[10px]">已解决</Badge>}
                        <span className="text-xs text-ink-400 ml-auto">
                          {new Date(m.created_at).toLocaleDateString("zh-CN")}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-ink-500 font-medium">问题</p>
                          <p className="text-sm text-ink-800 leading-relaxed font-display">{m.question}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-lg bg-error-bg border border-error/20">
                            <p className="text-[10px] text-error font-bold uppercase">你的答案</p>
                            <p className="text-xs text-ink-700 mt-0.5">{m.user_answer || <span className="italic text-ink-400">（未作答）</span>}</p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-success-bg border border-success/20">
                            <p className="text-[10px] text-success font-bold uppercase">正确答案</p>
                            <p className="text-xs text-ink-700 mt-0.5">{m.correct_answer}</p>
                          </div>
                        </div>
                      </div>

                      {/* AI explanation (collapsible) */}
                      {m.ai_explanation && (
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : m.id)}
                            className="flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-800 font-semibold transition-colors"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            AI 解析
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 p-3 rounded-lg bg-ink-50 border-l-2 border-ink-300 animate-slide-up">
                              <p className="text-xs text-ink-700 leading-relaxed whitespace-pre-wrap">{m.ai_explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      {!m.resolved && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-success-bg" onClick={() => handleResolve(m.id)} title="标记解决">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-error-bg" onClick={() => handleDelete(m.id)} title="删除">
                        <Trash2 className="w-4 h-4 text-error" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Mistake Review Modal */}
      <MistakeReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onComplete={() => load()}
      />
    </div>
  )
}
