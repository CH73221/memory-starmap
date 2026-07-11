import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { BackgroundPathsLayer } from "@/components/ui/background-paths"

const VIDEOS = [
  "/videos/bloom-01.mp4",
  "/videos/bloom-02.mp4",
  "/videos/bloom-03.mp4",
]

export default function HomeLandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const stageRef = useRef<HTMLDivElement>(null)

  const targetProgress = useRef(0)
  const currentProgress = useRef(0)
  const [progress, setProgress] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState("")
  const [videosReady, setVideosReady] = useState<boolean[]>([false, false, false])
  const [hasOpened, setHasOpened] = useState(false) // 控制首次载入动画

  // 滚动监听
  useEffect(() => {
    const onScroll = () => {
      const stage = stageRef.current
      if (!stage) return
      const max = stage.clientHeight - window.innerHeight
      targetProgress.current = max > 0 ? Math.min(1, window.scrollY / max) : 0
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // 平滑滚动动画
  useEffect(() => {
    let raf = 0
    let settledCount = 0
    const loop = () => {
      const diff = targetProgress.current - currentProgress.current
      if (Math.abs(diff) > 0.0005) {
        currentProgress.current += diff * 0.08
        setProgress(currentProgress.current)
        settledCount = 0
      } else {
        settledCount++
        if (settledCount > 10) return
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  // 立即启动入场动画 — 不等待视频加载，视频在后台加载完成后自动淡入
  useEffect(() => {
    const t = setTimeout(() => setHasOpened(true), 200)
    return () => clearTimeout(t)
  }, [])

  const handleEnterApp = () => navigate(isAuthenticated ? "/app" : "/login")

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const onCtaClick = () => {
    const stage = stageRef.current
    if (!stage) return
    const max = stage.clientHeight - window.innerHeight
    window.scrollTo({ top: max * 0.32, behavior: "smooth" })
  }

  const p = progress
  const activeIdx = Math.min(2, Math.floor(p * 3))

  const markVideoReady = (i: number) => {
    setVideosReady((r) => { const n = [...r]; n[i] = true; return n })
  }

  // ============== Spring-physics 入场动画参数 ==============
  const introDelay = (i: number) => hasOpened ? `${i * 0.12}s` : "0s"
  const introStyle = (i: number, distance = 60): React.CSSProperties => ({
    opacity: hasOpened ? 1 : 0,
    transform: hasOpened
      ? "translate3d(0, 0, 0) scale(1)"
      : `translate3d(0, ${distance}px, 0) scale(0.96)`,
    transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${introDelay(i)}, transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) ${introDelay(i)}`,
  })

  // ============== 每个 section 的独立进度窗口 ==============
  const heroVisible = p < 0.18
  const heroOpacity = heroVisible ? Math.max(0, 1 - Math.max(0, (p - 0.1) / 0.08)) : 0
  const heroTranslate = p * 80
  const heroBlur = Math.min(20, p * 120)
  const brandOpacity = Math.max(0, 1 - p * 5)

  const featIn = Math.max(0, Math.min(1, (p - 0.12) / 0.1))
  const featOut = Math.max(0, Math.min(1, (p - 0.36) / 0.06))
  const featVisible = featIn > 0 && featOut < 1
  const featProgress = featIn * (1 - featOut)
  const featCard1X = -40 * (1 - featIn)
  const featCard2Y = 30 * (1 - featIn)
  const featCard3X = 40 * (1 - featIn)
  const featBlur = Math.max(0, (1 - featIn) * 12)

  const m1In = Math.max(0, Math.min(1, (p - 0.4) / 0.08))
  const m1Out = Math.max(0, Math.min(1, (p - 0.5) / 0.05))

  const m2In = Math.max(0, Math.min(1, (p - 0.55) / 0.08))
  const m2Out = Math.max(0, Math.min(1, (p - 0.65) / 0.05))

  const m3In = Math.max(0, Math.min(1, (p - 0.7) / 0.08))
  const m3Out = Math.max(0, Math.min(1, (p - 0.8) / 0.05))

  const formProgress = Math.max(0, Math.min(1, (p - 0.85) / 0.1))

  return (
    <div
      ref={stageRef}
      className="relative"
      style={{
        height: "500vh",
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        color: "white",
        background: "linear-gradient(135deg, #0a0a0f 0%, #12121f 40%, #0d0d18 70%, #08080f 100%)",
      }}
    >
      {/* Fixed full-screen stage */}
      <div className="fixed inset-0 overflow-hidden">
        {/* 流线动效背景 — 始终可见，视频加载后降低透明度作为底层装饰 */}
        <div className="absolute inset-0" style={{ zIndex: 0, opacity: videosReady[0] ? 0.12 : 0.5, transition: "opacity 1s ease" }}>
          <BackgroundPathsLayer />
        </div>

        {/* 3 个视频叠加 - 根据滚动进度显示对应视频（按需加载优化） */}
        {VIDEOS.map((src, i) => {
          const shouldLoad = Math.abs(i - activeIdx) <= 1
          return (
          <video
            key={src}
            src={shouldLoad ? src : undefined}
            muted
            playsInline
            autoPlay
            loop
            preload={i === 0 ? "auto" : "none"}
            onCanPlay={() => markVideoReady(i)}
            onError={() => { console.warn("[Bloom] video error", src); markVideoReady(i) }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              // 视频加载完成后才显示，未加载时透明（露出渐变+流线背景）
              opacity: (i === activeIdx && videosReady[i]) ? 1 : 0,
              transition: "opacity 1s ease",
              zIndex: 0,
            }}
          />
          )
        })}

        {/* Subtle dark overlay for legibility */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" style={{ zIndex: 1 }} />

        {/* ============== SECTION 1: BRAND + HERO CARD (0~0.18) ============== */}
        {p < 0.18 && (
          <>
            {/* Brand top-left */}
            <div
              className="absolute top-6 left-6 z-20 flex items-center gap-2.5"
              style={{
                opacity: brandOpacity * (hasOpened ? 1 : 0),
                ...introStyle(0, 20),
              }}
            >
              <svg viewBox="0 0 32 32" className="w-7 h-7" fill="white">
                <path d="M16 4 C19 9 22 11 27 12 C22 13 19 15 16 20 C13 15 10 13 5 12 C10 11 13 9 16 4 Z" />
                <circle cx="16" cy="16" r="1.5" />
                <path d="M16 22 C18 25 19 27 19 28 C17 27 15 26 14 25 C14.5 24 15 23 16 22 Z" />
              </svg>
              <span className="text-lg font-medium tracking-wide">记忆星图</span>
            </div>

            {/* Enter App floating button (top-right) */}
            <button
              onClick={handleEnterApp}
              className="absolute top-6 right-6 z-30 px-5 py-2.5 text-sm font-medium"
              style={{
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                borderRadius: 999,
                fontFamily: "'Manrope', system-ui, sans-serif",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                opacity: (scrolled ? 0 : 1) * (hasOpened ? 1 : 0),
                pointerEvents: scrolled ? "none" : "auto",
                ...introStyle(0, -20),
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
            >
              {isAuthenticated ? "进入应用 →" : "登录 / 注册"}
            </button>

            {/* Hero glass card (left-bottom) */}
            <div
              className="absolute z-20 left-6 bottom-10 sm:left-12 sm:bottom-16 md:left-16 md:bottom-20 lg:left-20 lg:bottom-24"
              style={{
                opacity: heroOpacity,
                transform: `translate3d(0, ${heroTranslate}px, 0) scale(${1 - p * 0.05})`,
                filter: `blur(${heroBlur}px)`,
                maxWidth: "calc(100vw - 48px)",
                width: "min(720px, calc(100vw - 96px))",
                ...(hasOpened ? {} : { opacity: 0, transform: "translate3d(0, 60px, 0) scale(0.96)" }),
                transition: hasOpened
                  ? "opacity 0.6s ease-out, filter 0.4s ease-out, transform 0.5s ease-out"
                  : "opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s",
              }}
            >
              <div
                className="relative p-8 sm:p-10 md:p-12 lg:p-14"
                style={{
                  background: "rgba(255,255,255,0.32)",
                  backdropFilter: "blur(80px) saturate(180%)",
                  WebkitBackdropFilter: "blur(80px) saturate(180%)",
                  border: "1px solid rgba(255,255,255,0.45)",
                  borderRadius: 28,
                  boxShadow: "0 24px 80px rgba(0,0,0,0.45), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
                }}
              >
                <h1
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontSize: "clamp(38px, 7vw, 72px)",
                    lineHeight: 1.1,
                    fontWeight: 400,
                    color: "white",
                    margin: 0,
                  }}
                >
                  记住你学的<em style={{ fontStyle: "italic" }}>一切</em>。<br />
                  <em style={{ fontStyle: "italic" }}>永远</em>不忘。
                </h1>
                <p
                  style={{
                    fontFamily: "'Manrope', system-ui, sans-serif",
                    fontSize: "15px",
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.85)",
                    marginTop: "1.5rem",
                    maxWidth: "480px",
                  }}
                >
                  AI 驱动的间隔重复系统，在记忆即将消退的瞬间智能触发复习。基于 SM-2 算法与艾宾浩斯遗忘曲线，让学习效率提升 200%，每一份知识都被牢牢记住。
                </p>
                <button
                  onClick={onCtaClick}
                  className="mt-8 flex items-center gap-3 transition-all hover:gap-4"
                  style={{
                    background: "#cb8dff",
                    color: "white",
                    padding: "14px 28px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Manrope', system-ui, sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    boxShadow: "0 8px 24px rgba(203,141,255,0.35)",
                  }}
                >
                  向下滚动探索
                  <span style={{ fontSize: "18px" }}>→</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ============== SECTION 2: FEATURES (0.12~0.4) ============== */}
        {featVisible && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center px-6"
            style={{
              opacity: featProgress,
              filter: `blur(${featBlur}px)`,
            }}
          >
            <div className="max-w-5xl w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature Card 1 */}
                <div
                  className="p-7"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(40px) saturate(180%)",
                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 24,
                    transform: `translateX(${featCard1X}px)`,
                    transition: "transform 0.1s linear",
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(203,141,255,0.2)" }}>
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8 Z" />
                    </svg>
                  </div>
                  <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>AI 知识图谱</h3>
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
                    自动构建知识点关联网络，可视化你的整个知识体系。
                  </p>
                </div>
                {/* Feature Card 2 */}
                <div
                  className="p-7"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(40px) saturate(180%)",
                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 24,
                    transform: `translateY(${featCard2Y}px)`,
                    transition: "transform 0.1s linear",
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(139,195,74,0.2)" }}>
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="white" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="M3 9h18 M9 3v18" />
                    </svg>
                  </div>
                  <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>智能闪卡</h3>
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
                    上传笔记，AI 自动生成高质量复习闪卡，SM-2 算法排程。
                  </p>
                </div>
                {/* Feature Card 3 */}
                <div
                  className="p-7"
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(40px) saturate(180%)",
                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 24,
                    transform: `translateX(${featCard3X}px)`,
                    transition: "transform 0.1s linear",
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,167,38,0.2)" }}>
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83" />
                    </svg>
                  </div>
                  <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>遗忘曲线追踪</h3>
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
                    基于艾宾浩斯遗忘曲线，在记忆消退前精准触发复习。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============== SECTION 3: MISSION 1 (0.4~0.55) ============== */}
        {m1In > 0 && m1Out < 1 && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center px-6"
            style={{ opacity: m1In * (1 - m1Out) }}
          >
            <div className="max-w-2xl text-center" style={{ ...introStyle(0, 40) }}>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "13px", letterSpacing: "0.3em", color: "rgba(203,141,255,0.8)", marginBottom: "1.5rem", textTransform: "uppercase" }}>MISSION 01</p>
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1.15, fontWeight: 400 }}>
                让每一次复习都<em style={{ fontStyle: "italic" }}>恰到好处</em>
              </h2>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "16px", lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginTop: "1.5rem", maxWidth: "520px", margin: "1.5rem auto 0" }}>
                SM-2 间隔重复算法根据你的评分动态调整复习间隔，在记忆即将消退的黄金时刻触发复习，用最少的时间记住最多的知识。
              </p>
            </div>
          </div>
        )}

        {/* ============== SECTION 4: MISSION 2 (0.55~0.7) ============== */}
        {m2In > 0 && m2Out < 1 && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center px-6"
            style={{ opacity: m2In * (1 - m2Out) }}
          >
            <div className="max-w-2xl text-center" style={{ ...introStyle(0, 40) }}>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "13px", letterSpacing: "0.3em", color: "rgba(139,195,74,0.8)", marginBottom: "1.5rem", textTransform: "uppercase" }}>MISSION 02</p>
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1.15, fontWeight: 400 }}>
                AI 深度解析<em style={{ fontStyle: "italic" }}>每一份笔记</em>
              </h2>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "16px", lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginTop: "1.5rem", maxWidth: "520px", margin: "1.5rem auto 0" }}>
                上传 PDF、Word、图片或纯文本，GPT-4o 深度理解内容，自动提取知识点、构建关联、生成闪卡，6 步流水线全自动。
              </p>
            </div>
          </div>
        )}

        {/* ============== SECTION 5: MISSION 3 (0.7~0.85) ============== */}
        {m3In > 0 && m3Out < 1 && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center px-6"
            style={{ opacity: m3In * (1 - m3Out) }}
          >
            <div className="max-w-2xl text-center" style={{ ...introStyle(0, 40) }}>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "13px", letterSpacing: "0.3em", color: "rgba(255,167,38,0.8)", marginBottom: "1.5rem", textTransform: "uppercase" }}>MISSION 03</p>
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1.15, fontWeight: 400 }}>
                可视化你的<em style={{ fontStyle: "italic" }}>知识星空</em>
              </h2>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "16px", lineHeight: 1.8, color: "rgba(255,255,255,0.7)", marginTop: "1.5rem", maxWidth: "520px", margin: "1.5rem auto 0" }}>
                所有知识点自动构建成星空式网络图，按学习主题分组着色，搜索、过滤、点击查看详情，学习进度一目了然。
              </p>
            </div>
          </div>
        )}

        {/* ============== SECTION 6: SUBSCRIBE (0.85~1.0) ============== */}
        {formProgress > 0 && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center px-6"
            style={{ opacity: formProgress }}
          >
            <div
              className="max-w-md w-full p-8 sm:p-10"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(60px) saturate(180%)",
                WebkitBackdropFilter: "blur(60px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 28,
                ...introStyle(0, 40),
              }}
            >
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "36px", fontWeight: 400, marginBottom: "8px", textAlign: "center" }}>
                准备好<em style={{ fontStyle: "italic" }}>开始了</em>？
              </h2>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: "2rem" }}>
                留下邮箱，第一时间获取产品更新
              </p>
              <form onSubmit={handleSubscribe}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@memory.star" className="w-full px-4 py-3 mb-3 outline-none" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "white", fontFamily: "'Manrope', system-ui, sans-serif", fontSize: "14px", borderRadius: 14 }} />
                <button type="submit" className="w-full py-3 transition-all hover:scale-[1.02] active:scale-95" style={{ background: submitted ? "#059669" : "#cb8dff", color: "white", fontFamily: "'Manrope', system-ui, sans-serif", fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em", borderRadius: 14, border: "none", cursor: "pointer", textTransform: "uppercase", boxShadow: submitted ? "0 8px 24px rgba(5,150,105,0.3)" : "0 8px 24px rgba(203,141,255,0.35)" }}>{submitted ? "✓ 欢迎加入" : "立即开始"}</button>
                {submitted && <p style={{ fontFamily: "'Manrope', system-ui, sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: 16, textAlign: "center" }}>欢迎加入记忆探索者，第一次复习已为你准备好。</p>}
              </form>
            </div>
          </div>
        )}

        {/* Scroll hint */}
        {hasOpened && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none" style={{ opacity: scrolled ? 0 : 1, transition: "opacity 0.3s ease" }}>
            <div className="w-6 h-10 flex items-start justify-center p-1.5" style={{ border: "1px solid rgba(255,255,255,0.4)", borderRadius: 999, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
              <div className="w-1 h-2 rounded-full bg-white/70" style={{ animation: "scrollHint 1.5s ease-in-out infinite" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
