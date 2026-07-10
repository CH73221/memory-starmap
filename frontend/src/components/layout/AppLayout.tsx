import { useState, useEffect } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { useAuthStore } from "@/stores/authStore"
import { useOnlineStatus } from "@/hooks/useServiceWorker"
import { cn } from "@/lib/utils"
import { ScrollProgress } from "@/components/dashboard/ScrollProgress"
import { BackgroundPathsLayer } from "@/components/ui/background-paths"
import {
  LayoutDashboard, BookOpen, GitBranch, CreditCard, BarChart3, Brain, Calendar,
  LogOut, Menu, X, Star, WifiOff, Home, Castle, AlertTriangle, Target, Trophy, FileText, CalendarDays,
  Award, ChevronRight,
} from "lucide-react"

// ── 导航分组：按功能逻辑组织，而非平铺 ──
const navGroups = [
  {
    label: null, // 无标签的核心组
    items: [
      { path: "/app", label: "仪表盘", icon: LayoutDashboard },
      { path: "/app/review", label: "闪卡复习", icon: CreditCard, badge: "today" as const },
    ],
  },
  {
    label: "学习",
    items: [
      { path: "/app/materials", label: "学习资料", icon: BookOpen },
      { path: "/app/graph", label: "知识图谱", icon: GitBranch },
      { path: "/app/notes", label: "双链笔记", icon: FileText },
      { path: "/app/plans", label: "学习计划", icon: Calendar },
    ],
  },
  {
    label: "工具",
    items: [
      { path: "/app/ai", label: "AI 助手", icon: Brain, highlight: true },
      { path: "/app/palace", label: "记忆宫殿", icon: Castle },
      { path: "/app/mistakes", label: "错题本", icon: AlertTriangle },
      { path: "/app/focus", label: "专注模式", icon: Target },
    ],
  },
  {
    label: "成长",
    items: [
      { path: "/app/stats", label: "学习统计", icon: BarChart3 },
      { path: "/app/leaderboard", label: "排行榜", icon: Trophy },
      { path: "/app/achievements", label: "成就徽章", icon: Award },
    ],
  },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const isOnline = useOnlineStatus()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => { logout(); navigate("/login") }

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  return (
    <div className="flex h-screen bg-paper-50 overflow-hidden">
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-sm lg:hidden transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── 侧边栏：现代分组式布局 ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[240px] bg-white/80 backdrop-blur-xl border-r border-paper-200",
          "transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto",
          "flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 品牌区 — 紧凑现代 header */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-paper-200/80 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-ink-800 flex items-center justify-center">
            <Star className="w-4 h-4 text-amber" strokeWidth={2} fill="currentColor" />
          </div>
          <span className="text-[15px] font-display font-semibold text-ink-800 tracking-tight">记忆星图</span>
          <button className="ml-auto lg:hidden p-1.5 rounded-md hover:bg-ink-50" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* 导航区 — 分组式滚动列表 */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin">
          {navGroups.map((group, gi) => (
            <div key={gi} className="space-y-0.5">
              {group.label && (
                <p className="px-2.5 mb-1.5 text-[10px] font-medium text-ink-300 uppercase tracking-[0.12em]">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path ||
                  (item.path === "/app" && location.pathname === "/app")
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-200",
                      isActive
                        ? "bg-ink-800/[0.06] text-ink-800 font-medium"
                        : "text-ink-500 hover:bg-ink-50 hover:text-ink-700"
                    )}
                  >
                    {/* 激活指示条 — spring 滑动 */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-bar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-ink-700"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200",
                        isActive ? "text-ink-700" : "text-ink-300 group-hover:text-ink-500"
                      )}
                      strokeWidth={1.75}
                    />
                    <span className="truncate">{item.label}</span>
                    {/* AI 助手高亮 */}
                    {(item as any).highlight && !isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                    )}
                    {/* 今日复习 badge */}
                    {(item as any).badge === "today" && !isActive && (
                      <span className="ml-auto text-[10px] text-ink-300 group-hover:text-ink-400">→</span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* 首页链接 — 底部独立 */}
          <div className="pt-2 border-t border-paper-200/80">
            <Link
              to="/"
              className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-ink-400 hover:bg-ink-50 hover:text-ink-600 transition-all"
            >
              <Home className="w-[18px] h-[18px] text-ink-300 group-hover:text-ink-400" strokeWidth={1.75} />
              <span>返回首页</span>
              <ChevronRight className="ml-auto w-3 h-3 text-ink-300 group-hover:text-ink-400" />
            </Link>
          </div>
        </nav>

        {/* 用户区 — 紧凑现代卡片 */}
        <div className="border-t border-paper-200/80 p-3 shrink-0">
          <div className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg hover:bg-ink-50 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ink-600 to-ink-800 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-white">{user?.username?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-ink-700 truncate leading-tight">{user?.username || "用户"}</p>
              <p className="text-[11px] text-ink-400 truncate leading-tight">{user?.email || ""}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-ink-300 hover:text-ink-600 hover:bg-ink-100 transition-colors opacity-0 group-hover:opacity-100"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶栏 — 极简浮动 header */}
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-paper-200/80">
          <div className="flex items-center gap-4 px-4 lg:px-6 h-14">
            <Link to="/app" className="flex items-center gap-2 shrink-0 lg:hidden">
              <Star className="w-5 h-5 text-ink-700" strokeWidth={1.5} />
            </Link>
            <div className="hidden md:block flex-1 max-w-xl mx-auto"><ScrollProgress /></div>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs text-ink-400 hidden lg:inline">
                {new Date().toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric" })}
              </span>
              <LevelBadge />
              <DailyNoteButton />
              <button
                className="lg:hidden p-1.5 -mr-1 rounded-md text-ink-500 hover:bg-ink-50"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <div className="md:hidden px-4 pb-2"><ScrollProgress /></div>
        </header>

        {!isOnline && (
          <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium shadow-sm">
              <WifiOff className="w-4 h-4" strokeWidth={1.75} /> 离线模式
            </div>
          </div>
        )}

        {/* 页面内容 — blur 过渡 */}
        <main className="flex-1 overflow-auto bg-paper-50 p-6 lg:p-8 smooth-scroll relative">
          {/* 内容区间隙装饰：流动 SVG 路径 — 极低透明度 */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.10]">
            <BackgroundPathsLayer />
          </div>
          {/* 内容区间隙装饰：扫描线 */}
          <div className="content-scan-line" />
          <div className="max-w-6xl mx-auto relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(6px)" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

function DailyNoteButton() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      const { noteService } = await import("@/services/noteService")
      const n = await noteService.openDaily()
      navigate(`/app/notes/${encodeURIComponent(n.title)}`)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="打开今日学习笔记"
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
    >
      <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.75} />
      <span>今日笔记</span>
    </button>
  )
}

// XP/Level badge in top bar
const XP_PER_REVIEW = 10
const XP_PER_MASTER = 50

function calculateLevel(xp: number): { level: number; title: string; currentXp: number; nextLevelXp: number; progress: number } {
  let level = 1, xpForCurrent = 0, xpForNext = 100
  while (xp >= xpForNext) { level++; xpForCurrent = xpForNext; xpForNext += level * 100 }
  const progress = xpForNext - xpForCurrent > 0 ? ((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100 : 0
  const titles: Record<number, string> = { 1: "初学者", 2: "勤奋学徒", 3: "知识新手", 4: "学习达人", 5: "记忆专家", 6: "学术精英", 7: "学神", 8: "学霸之巅", 9: "知识大师", 10: "传奇学者" }
  return { level, title: titles[Math.min(level, 10)] || "传奇学者", currentXp: xp - xpForCurrent, nextLevelXp: xpForNext - xpForCurrent, progress }
}

function LevelBadge() {
  const [totalXp, setTotalXp] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const loadXp = async () => {
      try {
        const { statsService } = await import("@/services/statsService")
        const stats = await statsService.getOverview()
        const xp = (stats.total_reviews || 0) * XP_PER_REVIEW + (stats.mastered_points || 0) * XP_PER_MASTER
        setTotalXp(xp)
      } catch (e) { /* ignore */ }
    }
    loadXp()
    const interval = setInterval(loadXp, 30000)
    return () => clearInterval(interval)
  }, [])

  const { level, title, currentXp, nextLevelXp, progress } = calculateLevel(totalXp)

  return (
    <div
      className="relative hidden sm:block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-ink-50 transition-colors group">
        <div className="w-6 h-6 rounded-full bg-ink-800 flex items-center justify-center">
          <span className="text-[9px] font-bold text-white leading-none">{level}</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium text-ink-600 leading-none">{title}</span>
          <div className="w-12 h-0.5 bg-ink-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full rounded-full bg-ink-700 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-56 z-50 animate-fade-in">
          <div className="p-3 rounded-xl bg-white border border-paper-200 shadow-lg">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-ink-800 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-white">Lv.{level}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800">{title}</p>
                <p className="text-xs text-ink-400">等级 {level}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-400">当前 XP</span>
                <span className="font-medium text-ink-600 tabular-nums">{currentXp} / {nextLevelXp}</span>
              </div>
              <div className="h-1 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-ink-700" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-ink-300">
                <span>总计 {totalXp.toLocaleString()} XP</span>
                <span>还需 {nextLevelXp - currentXp} XP</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
