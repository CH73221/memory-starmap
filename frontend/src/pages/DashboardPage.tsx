import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { statsService } from "@/services/statsService"
import { materialService } from "@/services/materialService"
import api from "@/services/api"
import type { StatsOverview, Material, MasteryData, HeatmapDay } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HeatMap } from "@/components/dashboard/HeatMap"
import { LevelProgress } from "@/components/dashboard/LevelProgress"
import { AchievementBadges } from "@/components/dashboard/AchievementBadges"
import { CalendarView } from "@/components/dashboard/CalendarView"
import { AIAnalysisPanel } from "@/components/dashboard/AIAnalysisPanel"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { MosaicFlowBg } from "@/components/art/MosaicFlowBg"
import { StaggerGrid, StaggerItem } from "@/components/ui/motion-components"
import { cn } from "@/lib/utils"
import {
  BookOpen, CreditCard, GitBranch, Upload, Brain, ArrowRight,
  Zap, Play, FileText, Flame, Target,
} from "lucide-react"

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [mastery, setMastery] = useState<MasteryData[]>([])
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([])
  const [loading, setLoading] = useState(true)
  const [importingSample, setImportingSample] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [statsData, materialsData, masteryData, heatmapResp] = await Promise.all([
        statsService.getOverview(),
        materialService.list(),
        statsService.getMastery(),
        statsService.getHeatmap(),
      ])
      setStats(statsData)
      setMaterials(materialsData.items.slice(0, 5))
      setMastery(masteryData)
      setHeatmapData(heatmapResp.data)
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleImportSample = async () => {
    if (importingSample) return
    setImportingSample(true)
    try {
      await api.post("/sample-data")
      await loadData()
    } catch (e) {
      console.error(e)
      try {
        await materialService.importSample()
      } catch (e2) {
        console.error(e2)
      }
    } finally {
      setImportingSample(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  const todayReviewCount = stats?.today_review_count || 0
  const dailyGoal = 20
  const goalProgress = Math.min((todayReviewCount / dailyGoal) * 100, 100)

  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const weekdayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  const weekdayStr = weekdayNames[today.getDay()]

  const statItems: Array<{ label: string; value: number; suffix?: string; icon: typeof BookOpen }> = [
    { label: "总知识点", value: stats?.total_knowledge_points || 0, icon: BookOpen },
    { label: "已掌握", value: stats?.mastered_points || 0, icon: Target },
    { label: "今日待复习", value: stats?.today_review_count || 0, icon: CreditCard },
    { label: "连续学习", value: stats?.study_streak || 0, suffix: " 天", icon: Flame },
  ]

  return (
    <div className="relative space-y-8 max-w-6xl mx-auto">
      {/* ===== 全屏流动马赛克 Hero — MiMo 风格大面积背景 ===== */}
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[28px] overflow-hidden border border-paper-200/60 shadow-xl"
        style={{ minHeight: "60vh" }}
      >
        {/* 流动马赛克背景 — MiMo 风格大方块网格，高透明度 */}
        <div className="absolute inset-0">
          <MosaicFlowBg
            tileSize={52}
            gap={8}
            radiusRatio={0.25}
            speed={0.00035}
            baseOpacity={0.06}
            amplitude={0.20}
            highlightRatio={0.07}
            color="#1a1a2e"
            color2="#c87941"
            color3="#5b8c5a"
          />
        </div>

        {/* 顶部渐变叠加 — 让马赛克在顶部更清晰 */}
        <div className="absolute inset-0 bg-gradient-to-b from-paper-50/10 via-paper-50/5 to-paper-50/60 pointer-events-none" />

        {/* Hero 内容 */}
        <section className="relative z-10 flex flex-col gap-10 px-8 py-12 md:px-16 md:py-16 min-h-[60vh]">
          {/* 问候 + 日期 */}
          <div className="space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="text-5xl md:text-6xl font-display font-semibold text-ink-800 leading-tight tracking-tight"
            >
              {getGreeting()}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-base text-ink-500 font-sans tracking-wide"
            >
              {dateStr} · {weekdayStr} · 记忆星图
            </motion.p>
          </div>

          {/* 大型统计数字 — 4列网格，每个带图标 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 flex-1 content-center"
          >
            {statItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + idx * 0.08, type: "spring", stiffness: 300, damping: 25 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-ink-800/8 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-ink-500" strokeWidth={1.75} />
                    </div>
                    <p className="text-[11px] text-ink-400 uppercase tracking-widest font-sans">
                      {item.label}
                    </p>
                  </div>
                  <p className="text-4xl md:text-5xl font-display font-semibold text-ink-800 leading-none tracking-tight tabular-nums">
                    <AnimatedNumber value={item.value} duration={1000} suffix={item.suffix} />
                  </p>
                </motion.div>
              )
            })}
          </motion.div>

          {/* 底部操作区 — 进度 + 开始复习按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4"
          >
            <div className="flex items-center gap-4">
              {todayReviewCount > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-ink-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber animate-pulse" />
                    今日 {todayReviewCount} 张闪卡待复习
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-24 h-1 bg-paper-200/80 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-amber rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${goalProgress}%` }}
                        transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <span className="text-xs text-ink-400 tabular-nums">{Math.round(goalProgress)}%</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-500 font-medium">今日复习已完成，保持节奏</p>
              )}
            </div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <Link to="/app/review" className="shrink-0">
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-xl bg-ink-800 hover:bg-ink-900 text-white font-medium text-sm shadow-xl shadow-ink-800/15"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  开始复习
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </motion.div>

      {/* ===== 等级进度 ===== */}
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <LevelProgress
          totalReviews={stats?.total_reviews || 0}
          masteredPoints={stats?.mastered_points || 0}
        />
      </motion.div>

      {/* ===== 学习热力图 ===== */}
      <motion.section
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-display font-semibold text-ink-800">学习热力图</h2>
          <p className="text-xs text-ink-400 font-sans">过去一年的每日复习记录</p>
        </div>
        <Card className="premium-card border-[var(--border-light)] shadow-sm">
          <CardContent className="p-6">
            <HeatMap data={heatmapData} />
          </CardContent>
        </Card>
      </motion.section>

      {/* ===== AI 分析 ===== */}
      <motion.section
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="pt-2"
      >
        <AIAnalysisPanel />
      </motion.section>

      {/* ===== 掌握度进度 ===== */}
      {mastery.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-display font-semibold text-ink-800">各资料掌握度</h2>
          </div>
          <Card className="premium-card border-[var(--border-light)] shadow-sm">
            <CardContent className="p-6 space-y-5">
              {mastery.map((item, idx) => (
                <div key={item.material_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-700 font-sans">{item.material_title}</span>
                    <span className="text-xs text-ink-400 font-sans tabular-nums">{item.mastered_points}/{item.total_points}</span>
                  </div>
                  <div className="h-[2px] bg-[var(--border-light)] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-ink-800 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.mastery_level * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* ===== 成就徽章 + 日历视图 ===== */}
      <StaggerGrid className="grid grid-cols-1 lg:grid-cols-3 gap-6" stagger={0.1} delay={0.5}>
        <StaggerItem className="lg:col-span-2">
          <Card className="premium-card border-[var(--border-light)] shadow-sm">
            <CardContent className="p-6">
              <AchievementBadges />
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <CalendarView data={heatmapData} />
        </StaggerItem>
      </StaggerGrid>

      {/* ===== 快速操作 ===== */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-0 divide-y divide-[var(--border-light)] border-t border-[var(--border-light)] border-b border-[var(--border-light)]"
      >
        {[
          { to: "/app/materials", icon: Upload, label: "上传资料", desc: "上传 PDF、图片或文本笔记" },
          { to: "/app/review", icon: CreditCard, label: "开始复习", desc: `今日 ${stats?.today_review_count || 0} 张闪卡待复习` },
          { to: "/app/graph", icon: GitBranch, label: "知识图谱", desc: "可视化你的知识网络" },
        ].map((action) => (
          <Link key={action.to} to={action.to}>
            <motion.div
              className="flex items-center gap-4 py-4 group hover:bg-paper-100/50 -mx-2 px-2 rounded-lg transition-colors"
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center shrink-0">
                <action.icon className="w-5 h-5 text-amber" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-ink-800 group-hover:text-ink-900 font-sans">{action.label}</h3>
                <p className="text-xs text-ink-400 font-sans">{action.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-ink-600 group-hover:translate-x-0.5 transition-all" />
            </motion.div>
          </Link>
        ))}
      </motion.section>

      {/* ===== 最近资料 ===== */}
      {materials.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-ink-800">最近上传</h2>
            <Link to="/app/materials" className="text-xs text-ink-400 hover:text-ink-700 font-sans transition-colors premium-link">
              查看全部 <ArrowRight className="w-3 h-3 inline ml-0.5" />
            </Link>
          </div>
          <Card className="premium-card border-[var(--border-light)] shadow-sm">
            <CardContent className="p-0 divide-y divide-[var(--border-light)]">
              {materials.map((m) => (
                <motion.div
                  key={m.id}
                  className="flex items-center gap-3 p-4 hover:bg-paper-100/50 transition-colors cursor-pointer"
                  whileHover={{ x: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <div className="w-9 h-9 rounded-lg bg-ink-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-ink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate font-sans">{m.title}</p>
                    <p className="text-xs text-ink-400 font-sans">{m.knowledge_point_count || 0} 个知识点</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] rounded-md font-sans",
                      m.status === "completed" ? "text-success border-success/30 bg-success/5" :
                      m.status === "processing" ? "text-amber border-amber/30 bg-amber/5" :
                      m.status === "pending" ? "text-ink-400 border-ink-200" :
                      "text-error border-error/30 bg-error/5"
                    )}
                  >
                    {m.status === "completed" ? "已完成" : m.status === "processing" ? "处理中" : m.status === "pending" ? "待处理" : "失败"}
                  </Badge>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* ===== 空状态 ===== */}
      {!loading && stats?.total_knowledge_points === 0 && (
        <section className="text-center py-20 space-y-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-[var(--border-light)]">
            <FileText className="w-9 h-9 text-ink-300" strokeWidth={1.5} />
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl md:text-3xl font-display font-semibold text-ink-800">
              开启你的学习之旅
            </h3>
            <p className="text-sm text-ink-400 max-w-sm mx-auto font-sans leading-relaxed">
              上传学习资料，AI 自动提取知识点、构建知识图谱、生成闪卡，让记忆更高效
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/app/materials">
              <Button
                size="lg"
                className="h-12 px-6 rounded-xl bg-ink-800 hover:bg-ink-900 text-white font-medium text-sm shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" /> 上传资料
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={handleImportSample}
              disabled={importingSample}
              className="h-12 px-6 rounded-xl border-ink-800/20 text-ink-700 hover:bg-ink-50 font-medium text-sm"
            >
              {importingSample ? (
                <>填充中...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" /> 快速体验</>
              )}
            </Button>
          </div>
          <p className="text-xs text-ink-400 font-sans">
            点击「快速体验」一键填充示例数据（3份资料、15个知识点、20张闪卡、3个学习计划、8道错题、6篇笔记等）
          </p>

          <div className="max-w-2xl mx-auto pt-8 border-t border-[var(--border-light)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                { step: 1, title: "上传资料", desc: "上传 PDF、图片或文本笔记", icon: Upload },
                { step: 2, title: "AI 提取", desc: "智能提取知识点，构建知识图谱", icon: Brain },
                { step: 3, title: "开始复习", desc: "闪卡间隔重复，高效记忆", icon: CreditCard },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg border border-[var(--border-light)] flex items-center justify-center shrink-0 text-xs font-semibold text-ink-500 font-sans">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-ink-800 font-sans">{s.title}</h4>
                      <p className="text-xs text-ink-400 mt-0.5 font-sans leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return "夜深了"
  if (hour < 9) return "早安"
  if (hour < 12) return "上午好"
  if (hour < 14) return "午安"
  if (hour < 18) return "下午好"
  if (hour < 22) return "晚上好"
  return "夜深了"
}
