import { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { authService } from "@/services/authService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Mail, Lock, User, BookOpen, ArrowRight } from "lucide-react"
import { BackgroundPathsLayer } from "@/components/ui/background-paths"
import { BootSequence } from "@/components/art/BootSequence"

/* ── 跑马灯滚动文字带 ── */
function MarqueeBand({
  items,
  duration = 30,
  reverse = false,
}: {
  items: string[]
  duration?: number
  reverse?: boolean
}) {
  const content = [...items, ...items]
  return (
    <div className="overflow-hidden marquee-paused">
      <div
        className={`marquee-track ${reverse ? "marquee-track-reverse" : ""}`}
        style={{ ["--marquee-duration" as string]: `${duration}s` } as React.CSSProperties}
      >
        {content.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 px-5 text-xs font-mono tracking-[0.15em] uppercase whitespace-nowrap text-ink-300"
          >
            <Star className="w-2.5 h-2.5 text-amber/40 fill-amber/20" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [booting, setBooting] = useState(false)
  const [bootOrigin, setBootOrigin] = useState({ x: 0.5, y: 0.5 })
  const [bootUsername, setBootUsername] = useState("")
  const pendingNavRef = useRef(false)

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [regUsername, setRegUsername] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")

  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  /* ── 鼠标跟随：rAF 节流，每帧最多更新一次 CSS 自定义属性 ── */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${x}%`)
      el.style.setProperty("--my", `${y}%`)
    })
  }, [])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const captureClickPosition = (e: React.FormEvent | React.MouseEvent) => {
    let clientX = window.innerWidth / 2
    let clientY = window.innerHeight / 2
    if ("clientX" in e && e.clientX !== undefined) {
      clientX = e.clientX
      clientY = e.clientY
    }
    setBootOrigin({
      x: clientX / window.innerWidth,
      y: clientY / window.innerHeight,
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    captureClickPosition(e)
    try {
      const result = await authService.login({ email: loginEmail, password: loginPassword })
      setAuth(result.user, result.access_token)
      setBootUsername(result.user?.username || "")
      setBooting(true)
      pendingNavRef.current = true
    } catch (err: any) {
      setError(err.response?.data?.detail || "登录失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    captureClickPosition(e)
    try {
      const result = await authService.register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
      })
      setAuth(result.user, result.access_token)
      setBootUsername(result.user?.username || regUsername)
      setBooting(true)
      pendingNavRef.current = true
    } catch (err: any) {
      setError(err.response?.data?.detail || "注册失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleBootComplete = () => {
    if (pendingNavRef.current) {
      pendingNavRef.current = false
      navigate("/app")
    }
  }

  useEffect(() => {
    if (!booting) return
    const timeout = setTimeout(() => {
      if (pendingNavRef.current) {
        pendingNavRef.current = false
        navigate("/app")
      }
    }, 4000)
    return () => clearTimeout(timeout)
  }, [booting, navigate])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen relative overflow-hidden bg-paper-50"
      style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%" } as React.CSSProperties}
    >
      {/* ═══ 第 1 层：鲜艳底层 — 被遮罩覆盖，鼠标镂空处可见 ═══ */}
      <div className="absolute inset-0 z-0">
        {/* 中心径向光晕（琥珀色） */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(200, 121, 65, 0.15) 0%, transparent 70%)",
          }}
        />

        {/* 大号背景文字 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="bg-mega-text font-display">STARMAP</span>
        </div>
      </div>

      {/* ═══ 第 2 层：聚光灯遮罩 — 半透明纸色覆盖，鼠标位置镂空 ═══ */}
      <div className="spotlight-overlay" />
      <div className="spotlight-ring" />

      {/* ═══ 第 2.5 层：流动 SVG 路径 — 位于聚光灯之上，始终可见 ═══ */}
      <div className="absolute inset-0 z-[6] pointer-events-none">
        <BackgroundPathsLayer vibrant />
      </div>

      {/* ═══ 第 3 层：固定滚动元素（跑马灯、竖排文字、浮动标签） ═══ */}

      {/* 顶部跑马灯 */}
      <div className="fixed top-0 left-0 right-0 z-20 py-3 border-b border-ink/8 bg-paper-50/80 backdrop-blur-md">
        <MarqueeBand
          items={[
            "记忆星图",
            "MEMORY STARMAP",
            "AI 智能复习引擎",
            "点亮知识星空",
            "SPACED REPETITION",
            "间隔重复算法",
          ]}
          duration={35}
        />
      </div>

      {/* 底部跑马灯 */}
      <div className="fixed bottom-0 left-0 right-0 z-20 py-3 border-t border-ink/8 bg-paper-50/80 backdrop-blur-md">
        <MarqueeBand
          items={[
            "基于 SM-2 间隔重复算法",
            "AI 驱动知识图谱",
            "记忆宫殿笔记系统",
            "ELO 知识掌握度评估",
            "遗忘曲线追踪",
            "个性化复习计划",
          ]}
          duration={40}
          reverse
        />
      </div>

      {/* 左侧竖排文字 */}
      <div className="fixed left-2 top-1/2 -translate-y-1/2 z-20 vertical-text-left text-[10px] font-mono tracking-[0.3em] uppercase text-ink-200 hidden md:block">
        SM-2 Algorithm · Spaced Repetition · Knowledge Graph
      </div>

      {/* 右侧竖排文字 */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-20 vertical-text-right text-[10px] font-mono tracking-[0.3em] uppercase text-ink-200 hidden md:block">
        Memory Palace · AI Powered · ELO Rating
      </div>

      {/* 浮动信息标签 */}
      <div className="fixed top-20 left-6 z-30 float-badge px-3 py-1.5 rounded-full text-[10px] tracking-wider text-ink-400 hidden sm:block">
        v2.0.0
      </div>
      <div className="fixed top-20 right-6 z-30 float-badge px-3 py-1.5 rounded-full text-[10px] tracking-wider text-ink-400 flex items-center gap-2 hidden sm:block">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        SYSTEM ONLINE
      </div>

      {/* ═══ 第 4 层：中央玻璃登录窗 ═══ */}
      <div className="relative z-30 min-h-screen flex items-center justify-center p-4 py-24">
        <div className="w-full max-w-md">
          {/* Logo 区域 */}
          <div className="text-center mb-8 login-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-5 relative">
              <div
                className="absolute inset-0 rounded-full breath-glow"
                style={{
                  background:
                    "radial-gradient(circle, rgba(200,121,65,0.18) 0%, transparent 70%)",
                }}
              />
              <div className="relative">
                <BookOpen className="w-10 h-10 text-ink-700" strokeWidth={1.25} />
                <Star
                  className="absolute -top-1 -right-1 w-4 h-4 text-amber fill-amber/50"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <h1 className="text-5xl font-display font-bold tracking-tight bg-gradient-to-b from-ink-800 via-ink-700 to-amber bg-clip-text text-transparent">
              记忆星图
            </h1>
            <p className="text-ink-300 mt-3 text-xs font-mono tracking-[0.25em] uppercase">
              AI Intelligence Review Engine
            </p>
          </div>

          {/* 玻璃登录卡 */}
          <div
            className="glass-login rounded-3xl login-slide-up"
            style={{ animationDelay: "0.15s" }}
          >
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-transparent p-0 h-auto rounded-none border-b border-ink/8">
                <TabsTrigger
                  value="login"
                  className="glass-tab relative py-3.5 px-4 text-sm font-medium rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none h-auto"
                >
                  登录
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="glass-tab relative py-3.5 px-4 text-sm font-medium rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none h-auto"
                >
                  注册
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin}>
                  <div className="p-6 pb-4">
                    <h2 className="text-xl font-display font-semibold text-ink-800 mb-1">
                      欢迎回来
                    </h2>
                    <p className="text-sm text-ink-400">登录你的账号开始复习</p>
                  </div>
                  <div className="px-6 space-y-4">
                    {error && (
                      <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label
                        htmlFor="login-email"
                        className="text-ink-500 font-medium text-sm"
                      >
                        邮箱
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          className="glass-input pl-10 h-11 rounded-xl"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="login-password"
                        className="text-ink-500 font-medium text-sm"
                      >
                        密码
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="输入密码"
                          className="glass-input pl-10 h-11 rounded-xl"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-4">
                    <Button
                      type="submit"
                      className="btn-amber-glow w-full h-12 rounded-xl font-medium border-0 flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        "登录中..."
                      ) : (
                        <>
                          登录
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister}>
                  <div className="p-6 pb-4">
                    <h2 className="text-xl font-display font-semibold text-ink-800 mb-1">
                      创建账号
                    </h2>
                    <p className="text-sm text-ink-400">注册后即可开始智能复习之旅</p>
                  </div>
                  <div className="px-6 space-y-4">
                    {error && (
                      <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label
                        htmlFor="reg-username"
                        className="text-ink-500 font-medium text-sm"
                      >
                        用户名
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
                        <Input
                          id="reg-username"
                          type="text"
                          placeholder="你的昵称"
                          className="glass-input pl-10 h-11 rounded-xl"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="reg-email"
                        className="text-ink-500 font-medium text-sm"
                      >
                        邮箱
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="your@email.com"
                          className="glass-input pl-10 h-11 rounded-xl"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="reg-password"
                        className="text-ink-500 font-medium text-sm"
                      >
                        密码
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="至少6位密码"
                          className="glass-input pl-10 h-11 rounded-xl"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 pt-4">
                    <Button
                      type="submit"
                      className="btn-amber-glow w-full h-12 rounded-xl font-medium border-0 flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        "注册中..."
                      ) : (
                        <>
                          注册
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* 底部信息 */}
          <div
            className="text-center mt-6 login-fade-in space-y-1"
            style={{ animationDelay: "0.4s" }}
          >
            <p className="text-ink-300 text-xs font-mono tracking-wider">
              基于 SM-2 间隔重复算法与 AI 驱动的知识图谱
            </p>
            <p className="text-ink-200 text-[10px] font-mono">
              DEMO: demo@starmap.com / demo123
            </p>
          </div>
        </div>
      </div>

      {/* ── 启动序列动效覆盖层 ── */}
      {booting && (
        <BootSequence
          originX={bootOrigin.x}
          originY={bootOrigin.y}
          username={bootUsername}
          onComplete={handleBootComplete}
        />
      )}
    </div>
  )
}
