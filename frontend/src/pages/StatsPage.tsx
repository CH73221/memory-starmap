import { useState, useEffect } from "react"
import { statsService } from "@/services/statsService"
import type { StatsOverview, MasteryData, TrendData, RadarData } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { FadeIn } from "@/components/ui/page-transition"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts"
import { TrendingUp, Brain, Target, Flame, BarChart3, Activity } from "lucide-react"
import { ForgettingCurveChart } from "@/components/dashboard/ForgettingCurveChart"

// 晨雾纸页掌握度分布色
const PAPER_MASTERY_COLORS = ["#b85450", "#c87941", "#6b6b8d", "#25253d", "#1a1a2e"]

function getPaperMasteryColor(level: number): string {
  if (level >= 0.8) return PAPER_MASTERY_COLORS[4]
  if (level >= 0.6) return PAPER_MASTERY_COLORS[3]
  if (level >= 0.4) return PAPER_MASTERY_COLORS[2]
  if (level >= 0.2) return PAPER_MASTERY_COLORS[1]
  return PAPER_MASTERY_COLORS[0]
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [mastery, setMastery] = useState<MasteryData[]>([])
  const [trend, setTrend] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [s, m, t] = await Promise.all([
        statsService.getOverview(), statsService.getMastery(),
        statsService.getTrend(30),
      ])
      setStats(s); setMastery(m); setTrend(t)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Skeleton className="h-80 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></div>
      </div>
    )
  }

  const masteryDistribution = [
    { name: "未掌握", value: mastery.filter(m => m.mastery_level < 0.2).length, color: PAPER_MASTERY_COLORS[0] },
    { name: "较薄弱", value: mastery.filter(m => m.mastery_level >= 0.2 && m.mastery_level < 0.4).length, color: PAPER_MASTERY_COLORS[1] },
    { name: "一般", value: mastery.filter(m => m.mastery_level >= 0.4 && m.mastery_level < 0.6).length, color: PAPER_MASTERY_COLORS[2] },
    { name: "较熟悉", value: mastery.filter(m => m.mastery_level >= 0.6 && m.mastery_level < 0.8).length, color: PAPER_MASTERY_COLORS[3] },
    { name: "已掌握", value: mastery.filter(m => m.mastery_level >= 0.8).length, color: PAPER_MASTERY_COLORS[4] },
  ].filter(d => d.value > 0)

  const masteryBarData = mastery.map(m => ({ name: m.material_title.length > 8 ? m.material_title.slice(0, 8) + "..." : m.material_title, 掌握度: Math.round(m.mastery_level * 100) }))

  const statNumbers = [
    { label: "总知识点", value: stats?.total_knowledge_points || 0 },
    { label: "已掌握", value: stats?.mastered_points || 0 },
    { label: "总复习次数", value: stats?.total_reviews || 0 },
    { label: "连续学习", value: stats?.study_streak || 0, suffix: " 天" },
  ]

  // 亮色 Tooltip 样式
  const lightTooltipStyle = {
    borderRadius: "8px",
    border: "1px solid #ddd8d1",
    background: "#ffffff",
    color: "#1a1a2e",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    fontSize: "12px",
    padding: "8px 12px",
  }

  return (
    <div className="space-y-6">
      <FadeIn className="spring-enter">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink-800">学习统计</h1>
          <p className="text-ink-400 mt-1 text-sm">用数据驱动你的学习效率</p>
        </div>
      </FadeIn>

      {/* 统计概览 - 水平数字行，divide-x 分割 */}
      <div className="stagger-item" style={{ animationDelay: "100ms" }}>
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center divide-x divide-gray-200">
              {statNumbers.map((s, i) => (
                <div key={s.label} className="flex-1 px-6 py-6 text-center first:pl-0 last:pr-0">
                  <p className="text-[10px] font-medium text-ink-400 uppercase tracking-widest mb-2">{s.label}</p>
                  <p className="text-4xl font-display font-bold text-ink-800 tabular-nums">
                    <AnimatedNumber value={s.value} duration={1000} suffix={s.suffix} />
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 遗忘曲线 */}
      <div className="stagger-item" style={{ animationDelay: "200ms" }}>
        <ForgettingCurveChart />
      </div>

      {/* Trend */}
      <div className="stagger-item" style={{ animationDelay: "300ms" }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-ink-700" />
              <span className="font-display font-semibold">近 30 天复习趋势</span>
            </CardTitle>
            <CardDescription>每日复习次数与趋势变化</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#25253d" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#25253d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="#ebe8e3" vertical={false} />
                  <XAxis dataKey="label" fontSize={10} stroke="#6b6b8d" tickLine={false} interval="preserveStartEnd" />
                  <YAxis fontSize={10} stroke="#6b6b8d" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={lightTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#25253d"
                    strokeWidth={2}
                    fill="url(#trendGrad)"
                    dot={{ r: 2, fill: "#25253d", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: "#25253d" }}
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-ink-400">暂无趋势数据</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 掌握度分布饼图（改为简单的水平条形图以适配纸页风） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stagger-item" style={{ animationDelay: "350ms" }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display font-semibold">掌握度分布</CardTitle>
              <CardDescription>各掌握程度的知识点数量</CardDescription>
            </CardHeader>
            <CardContent>
              {masteryDistribution.length > 0 ? (
                <div className="space-y-4">
                  {/* 水平堆叠条 */}
                  <div className="flex h-8 rounded-md overflow-hidden border border-gray-200">
                    {masteryDistribution.map((d) => {
                      const total = masteryDistribution.reduce((sum, item) => sum + item.value, 0)
                      const pct = total > 0 ? (d.value / total) * 100 : 0
                      return (
                        <div
                          key={d.name}
                          className="flex items-center justify-center transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: d.color }}
                          title={`${d.name}: ${d.value}`}
                        />
                      )
                    })}
                  </div>
                  {/* 图例 */}
                  <div className="space-y-2">
                    {masteryDistribution.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                          <span className="text-sm text-ink-600">{d.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-ink-800 tabular-nums">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-ink-400">暂无数据</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 各资料掌握度 */}
        <div className="stagger-item" style={{ animationDelay: "400ms" }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display font-semibold">各资料掌握度</CardTitle>
              <CardDescription>每份学习资料的平均掌握程度</CardDescription>
            </CardHeader>
            <CardContent>
              {masteryBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={masteryBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ebe8e3" />
                    <XAxis dataKey="name" fontSize={11} stroke="#6b6b8d" />
                    <YAxis fontSize={11} domain={[0, 100]} stroke="#6b6b8d" />
                    <Tooltip contentStyle={lightTooltipStyle} />
                    <Bar dataKey="掌握度" fill="#25253d" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-ink-400">暂无数据</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 详细掌握情况列表 */}
      {mastery.length > 0 && (
        <div className="stagger-item" style={{ animationDelay: "450ms" }}>
          <Card>
            <CardHeader><CardTitle className="text-lg font-display font-semibold">详细掌握情况</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                {mastery.map((item) => (
                  <div key={item.material_id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ink-800 truncate">{item.material_title}</span>
                        <span className="text-sm text-ink-400 shrink-0">{item.mastered_points}/{item.total_points} 已掌握</span>
                      </div>
                      <div className="h-2 bg-paper-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${item.mastery_level * 100}%`,
                            backgroundColor: getPaperMasteryColor(item.mastery_level),
                          }}
                        />
                      </div>
                    </div>
                    <Badge
                      className="shrink-0 rounded-md border-0"
                      style={{
                        backgroundColor: getPaperMasteryColor(item.mastery_level) + "15",
                        color: getPaperMasteryColor(item.mastery_level),
                      }}
                    >
                      {Math.round(item.mastery_level * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 空状态 */}
      {!loading && stats?.total_knowledge_points === 0 && (
        <FadeIn>
          <Card className="text-center py-16 border-dashed">
            <CardContent>
              <TrendingUp className="w-16 h-16 mx-auto text-ink-300 mb-4" />
              <h3 className="text-lg font-display font-semibold text-ink-700 mb-2">暂无学习数据</h3>
              <p className="text-ink-400">上传笔记并开始复习后，这里会显示你的学习统计</p>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}
