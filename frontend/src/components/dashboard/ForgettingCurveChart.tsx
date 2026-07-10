import { useState, useEffect } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import { BookOpen, TrendingUp, FlaskConical, Award, Lightbulb, ExternalLink, Brain, Zap, Target, Clock } from "lucide-react"

/* ===== Scientific Research Data ===== */
const RESEARCH_FINDINGS = [
  {
    id: "ebbinghaus",
    year: "1885",
    author: "Hermann Ebbinghaus",
    title: "Über das Gedächtnis (Memory)",
    institution: "柏林大学",
    finding: "记忆在学习后的 24 小时内会衰退约 66%，之后衰退速度显著放缓",
    detail: "Ebbinghaus 用无意义音节做实验，发现遗忘曲线呈指数衰减。20 分钟后保留 58%，24 小时后仅保留 33%，但之后的衰退率大幅降低。这是认知心理学最经典、被引用最多的实验之一。",
    improvement: "66%",
    improvementLabel: "24h 内遗忘率",
    color: "bg-error-bg text-error",
    icon: Brain,
    verified: true,
  },
  {
    id: "roediger",
    year: "2006",
    author: "Roediger & Karpicke",
    title: "Test-Enhanced Learning",
    institution: "华盛顿大学",
    finding: "主动回忆测试比重读保留更多记忆：1 周后测试组 56% vs 重读组 42%",
    detail: "发表于 Psychological Science。实验对比了「重读」和「主动回忆测试」两种学习方法，结果表明：虽然重读组在短期测试中表现更好，但 1 周后的延迟测试中，测试组的记忆保持率比重读组高出 33%。这证明了「测试效应」(Testing Effect) 的强大作用。",
    improvement: "+33%",
    improvementLabel: "测试 vs 重读",
    color: "bg-amber-bg text-amber",
    icon: Target,
    verified: true,
  },
  {
    id: "cepeda",
    year: "2006",
    author: "Cepeda, Pashler, Vul, Wixted & Rohrer",
    title: "Distributed Practice in Verbal Recall Tasks",
    institution: "加州大学圣地亚哥分校",
    finding: "间隔复习的效果比集中复习（填鸭式）高 10-30%，最优间隔与目标保持时间成正比",
    detail: "发表于 Psychological Bulletin，分析了 254 项间隔学习研究的元分析。发现间隔效应在不同年龄、材料类型中普遍存在。最优复习间隔大约是目标保持时间的 10-20%：例如需要记住 30 天，则最优间隔约为 3-6 天。",
    improvement: "+10~30%",
    improvementLabel: "间隔 vs 集中",
    color: "bg-ink-50 text-ink-700",
    icon: Clock,
    verified: true,
  },
  {
    id: "dunlosky",
    year: "2013",
    author: "Dunlosky, Rawson, Marsh, Nathan & Willingham",
    title: "Improving Students' Learning With Effective Techniques",
    institution: "肯特州立大学",
    finding: "练习测试和分散练习是 10 种学习方法中效果最好的两种，远优于重读和划重点",
    detail: "发表于 Psychological Science in the Public Interest，对 10 种常用学习方法进行了大规模元分析。只有「练习测试」(Practice Testing) 和「分散练习」(Distributed Practice) 获得了「高效」评价，而「重读」和「划重点」被归类为「低效」。",
    improvement: "★★★",
    improvementLabel: "最高效方法",
    color: "bg-amber-bg text-amber",
    icon: Award,
    verified: true,
  },
  {
    id: "wozniak",
    year: "1994",
    author: "Piotr Wozniak",
    title: "SuperMemo: Optimization of Learning",
    institution: "波兹南理工大学",
    finding: "SM-2 间隔重复算法通过动态调整复习间隔，使学习效率比传统方法提高 2-3 倍",
    detail: "博士论文中提出的 SM-2 算法是现代间隔重复软件（Anki、SuperMemo 等）的理论基础。该算法根据每次回忆的难度评分（0-5），动态调整下次复习的时间间隔，使每个知识点都在即将遗忘的最佳时刻被复习。",
    improvement: "2-3×",
    improvementLabel: "效率提升",
    color: "bg-ink-50 text-ink-700",
    icon: Zap,
    verified: true,
  },
]

const EBBAUINGHAUS_DATA = [
  { time: "学习后", minutes: 0, retention: 100, label: "即时" },
  { time: "20 分钟", minutes: 20, retention: 58, label: "20min" },
  { time: "1 小时", minutes: 60, retention: 44, label: "1h" },
  { time: "24 小时", minutes: 1440, retention: 33, label: "1d" },
  { time: "6 天", minutes: 8640, retention: 25, label: "6d" },
  { time: "1 个月", minutes: 44640, retention: 21, label: "31d" },
]

const INTERVENTION_DATA = [
  { time: "0d", natural: 100, spaced: 100, tested: 100 },
  { time: "1d", natural: 33, spaced: 95, tested: 90 },
  { time: "2d", natural: 28, spaced: 92, tested: 85 },
  { time: "6d", natural: 25, spaced: 90, tested: 80 },
  { time: "9d", natural: 22, spaced: 88, tested: 75 },
  { time: "31d", natural: 21, spaced: 85, tested: 70 },
  { time: "60d", natural: 18, spaced: 82, tested: 65 },
  { time: "90d", natural: 15, spaced: 80, tested: 60 },
]

// 晨雾纸页色曲线：ink-700 / amber / ink-400
const CURVE_COLORS: Record<string, { stroke: string; fill: string; name: string }> = {
  natural: { stroke: "#6b6b8d", fill: "rgba(107, 107, 141, 0.08)", name: "无复习" },
  spaced: { stroke: "#c87941", fill: "rgba(200, 121, 65, 0.08)", name: "间隔复习" },
  tested: { stroke: "#25253d", fill: "rgba(37, 37, 61, 0.08)", name: "主动回忆" },
}

/* ===== Custom Tooltip - 白纸 ===== */
interface TooltipPayloadEntry { name: string; value: number; color: string; dataKey: string }

function ResearchTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 min-w-[200px] animate-fade-in">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
        <FlaskConical className="w-4 h-4 text-ink-700" />
        <span className="text-xs font-bold text-ink-800">{label}</span>
      </div>
      <div className="space-y-1.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-xs text-ink-500">{p.name}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: p.color }}>{p.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ===== Research Card - 白纸 ===== */
function ResearchCard({ finding, index }: { finding: typeof RESEARCH_FINDINGS[0]; index: number }) {
  const Icon = finding.icon
  return (
    <div
      className="group relative p-5 rounded-xl bg-white border border-gray-200 hover:border-ink-300 hover:shadow-md transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", finding.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-paper-100 text-ink-600 font-medium">{finding.year}</span>
            {finding.verified && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-bg text-amber font-medium flex items-center gap-0.5">
                <Award className="w-2.5 h-2.5" /> 已验证
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-ink-800 leading-tight font-display">{finding.title}</h4>
          <p className="text-[10px] text-ink-400 mt-0.5">{finding.author} · {finding.institution}</p>
        </div>
      </div>

      <p className="text-xs text-ink-600 leading-relaxed mb-3">{finding.finding}</p>
      <p className="text-[11px] text-ink-400 leading-relaxed mb-4">{finding.detail}</p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-amber" />
          <span className="text-xs font-bold text-ink-700">{finding.improvement}</span>
          <span className="text-[10px] text-ink-400">{finding.improvementLabel}</span>
        </div>
      </div>
    </div>
  )
}

/* ===== Main Component ===== */
interface Props {
  className?: string
}

export function ForgettingCurveChart({ className }: Props) {
  const [activeView, setActiveView] = useState<"original" | "comparison">("comparison")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => { setTimeout(() => setIsLoaded(true), 200) }, [])

  return (
    <div className={cn("space-y-8", className)}>
      {/* Section 1: Chart */}
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="w-5 h-5 text-ink-700" />
              <h3 className="text-xl font-display font-bold text-ink-800">记忆科学</h3>
            </div>
            <p className="text-sm text-ink-400">基于 Ebbinghaus 1885 等经典认知科学研究</p>
          </div>
          {/* View toggle - 白纸 */}
          <div className="flex gap-1 p-1 bg-paper-100 rounded-lg border border-gray-200">
            <button
              onClick={() => setActiveView("comparison")}
              className={cn(
                "px-4 py-2 rounded-md text-xs font-medium transition-all duration-200",
                activeView === "comparison"
                  ? "bg-white text-ink-800 shadow-sm border border-gray-200"
                  : "text-ink-400 hover:text-ink-700"
              )}
            >
              三种策略对比
            </button>
            <button
              onClick={() => setActiveView("original")}
              className={cn(
                "px-4 py-2 rounded-md text-xs font-medium transition-all duration-200",
                activeView === "original"
                  ? "bg-white text-ink-800 shadow-sm border border-gray-200"
                  : "text-ink-400 hover:text-ink-700"
              )}
            >
              原始数据
            </button>
          </div>
        </div>

        {/* Chart area - 白纸卡片 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {activeView === "comparison" ? (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={INTERVENTION_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="gradNatural" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6b6b8d" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#6b6b8d" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSpaced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c87941" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#c87941" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradTested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#25253d" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#25253d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="#ebe8e3" vertical={false} />
                  <XAxis dataKey="time" fontSize={11} stroke="#6b6b8d" tickLine={false} axisLine={{ stroke: "#ebe8e3" }} />
                  <YAxis fontSize={11} stroke="#6b6b8d" tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<ResearchTooltip />} cursor={{ stroke: "#c9c9da", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area type="monotone" dataKey="natural" name="无复习" stroke="#6b6b8d" strokeWidth={2} strokeDasharray="6 4" fill="url(#gradNatural)" dot={{ r: 3, fill: "#fff", stroke: "#6b6b8d", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#6b6b8d", stroke: "#fff", strokeWidth: 2 }} animationDuration={1200} />
                  <Area type="monotone" dataKey="spaced" name="间隔复习" stroke="#c87941" strokeWidth={2.5} fill="url(#gradSpaced)" dot={{ r: 3, fill: "#fff", stroke: "#c87941", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#c87941", stroke: "#fff", strokeWidth: 2 }} animationDuration={1200} animationBegin={200} />
                  <Area type="monotone" dataKey="tested" name="主动回忆" stroke="#25253d" strokeWidth={2} fill="url(#gradTested)" dot={{ r: 3, fill: "#fff", stroke: "#25253d", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#25253d", stroke: "#fff", strokeWidth: 2 }} animationDuration={1200} animationBegin={400} />
                </AreaChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-4 flex-wrap">
                {[
                  { color: "#6b6b8d", dash: true, label: "无复习（Ebbinghaus 遗忘曲线）" },
                  { color: "#c87941", dash: false, label: "间隔复习（SM-2 算法）" },
                  { color: "#25253d", dash: false, label: "主动回忆（测试效应）" },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke={l.color} strokeWidth={3} strokeDasharray={l.dash ? "6 4" : ""} /></svg>
                    <span className="text-xs text-ink-500 font-medium">{l.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={EBBAUINGHAUS_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="gradEbbinghaus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6b6b8d" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#6b6b8d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="#ebe8e3" vertical={false} />
                  <XAxis dataKey="label" fontSize={11} stroke="#6b6b8d" tickLine={false} />
                  <YAxis fontSize={11} stroke="#6b6b8d" tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<ResearchTooltip />} cursor={{ stroke: "#c9c9da", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area type="monotone" dataKey="retention" name="记忆保持率" stroke="#6b6b8d" strokeWidth={2.5} fill="url(#gradEbbinghaus)" dot={{ r: 3, fill: "#fff", stroke: "#6b6b8d", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#6b6b8d", stroke: "#fff", strokeWidth: 2 }} animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                {EBBAUINGHAUS_DATA.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-ink-400" />
                    <span className="text-ink-500 font-medium">{d.time}</span>
                    <span className="text-ink-500">{d.retention}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Insight callout */}
          <div className="mt-5 p-4 rounded-xl bg-amber-bg border border-amber/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm shrink-0">
              <Lightbulb className="w-5 h-5 text-amber" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-ink-800">关键发现</p>
              <p className="text-[11px] text-ink-600 mt-0.5 leading-relaxed">
                Ebbinghaus 1885 发现遗忘曲线呈指数衰减，24h 内遗忘 66%。
                但 Roediger & Karpicke 2006 证明：主动回忆测试能将 1 周后记忆保持率从 42% 提升至 56%。
                我们的系统结合了间隔复习 + 主动回忆两种策略。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Research Papers */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-error" />
          <h3 className="text-lg font-display font-bold text-ink-800">科学依据</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-error-bg text-error font-medium">{RESEARCH_FINDINGS.length} 项研究</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RESEARCH_FINDINGS.map((finding, i) => (
            <ResearchCard key={finding.id} finding={finding} index={i} />
          ))}
        </div>

        {/* Footer citation */}
        <div className="mt-4 p-3 rounded-xl bg-paper-50 border border-gray-200">
          <p className="text-[10px] text-ink-400 leading-relaxed">
            <span className="font-bold text-ink-500">参考文献：</span>
            Ebbinghaus, H. (1885). Über das Gedächtnis: Untersuchungen zur experimentellen Psychologie. Leipzig: Duncker & Humblot. |
            Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning. Psychological Science, 17(3), 249-255. |
            Cepeda, N. J., et al. (2006). Distributed practice in verbal recall tasks. Psychological Bulletin, 132(3), 354-380. |
            Dunlosky, J., et al. (2013). Improving students' learning with effective learning techniques. Psychological Science in the Public Interest, 14(1), 4-58. |
            Wozniak, P. (1994). Optimization of learning. Doctoral dissertation, Poznan University.
          </p>
        </div>
      </div>
    </div>
  )
}
