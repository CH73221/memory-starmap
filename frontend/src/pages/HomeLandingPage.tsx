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
        // Animation settled — count frames, stop RAF after 10 idle frames
        settledCount++
        if (settledCount > 10) return
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  // 首次载入触发 - 第一个视频就绪或超时1.5s后启动入场动画
  useEffect(() => {
    if (hasOpened) return
    // 第一个视频就绪即启动
    if (videosReady[0]) {
      const t = setTimeout(() => setHasOpened(true), 80)
      return () => clearTimeout(t)
    }
    // 超时保护 — 5秒后强制启动，避免视频加载慢阻塞页面
    const timeout = setTimeout(() => setHasOpened(true), 5000)
    return () => clearTimeout(timeout)
  }, [videosReady, hasOpened])

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

  // ============== Spring-physics 入场动画参数 ==============
  // 所有玻璃盒子从「下方 + 轻微缩放 + 透明」进入
  // 弹性曲线 (Apple-style spring): 0.34, 1.56, 0.64, 1
  const introDelay = (i: number) => hasOpened ? `${i * 0.12}s` : "0s"
  const introStyle = (i: number, distance = 60): React.CSSProperties => ({
    opacity: hasOpened ? 1 : 0,
    transform: hasOpened
      ? "translate3d(0, 0, 0) scale(1)"
      : `translate3d(0, ${distance}px, 0) scale(0.96)`,
    transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${introDelay(i)}, transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) ${introDelay(i)}`,
  })

  // ============== 每个 section 的独立进度窗口（避免重叠） ==============
  // Hero: 0 ~ 0.12
  // Features: 0.12 ~ 0.4
  // Mission 1: 0.4 ~ 0.55
  // Mission 2: 0.55 ~ 0.7
  // Mission 3: 0.7 ~ 0.85
  // Subscribe: 0.85 ~ 1.0

  // Hero card：0~0.1 完全可见，0.1~0.18 淡出
  const heroVisible = p < 0.18
  const heroOpacity = heroVisible ? Math.max(0, 1 - Math.max(0, (p - 0.1) / 0.08)) : 0
  const heroTranslate = p * 80
  const heroBlur = Math.min(20, p * 120)
  const brandOpacity = Math.max(0, 1 - p * 5)

  // Features：0.12 开始进入，0.22 完全显示，0.36 开始离开
  const featIn = Math.max(0, Math.min(1, (p - 0.12) / 0.1))
  const featOut = Math.max(0, Math.min(1, (p - 0.36) / 0.06))
  const featVisible = featIn > 0 && featOut < 1
  const featProgress = featIn * (1 - featOut)
  const featCard1X = -40 * (1 - featIn)
  const featCard2Y = 30 * (1 - featIn)
  const featCard3X = 40 * (1 - featIn)
  const featBlur = Math.max(0, (1 - featIn) * 12)

  // Mission 1: 0.4 ~ 0.5 进入，0.55 离开
  const m1In = Math.max(0, Math.min(1, (p - 0.4) / 0.08))
  const m1Out = Math.max(0, Math.min(1, (p - 0.5) / 0.05))

  // Mission 2: 0.55 ~ 0.65 进入，0.7 离开
  const m2In = Math.max(0, Math.min(1, (p - 0.55) / 0.08))
  const m2Out = Math.max(0, Math.min(1, (p - 0.65) / 0.05))

  // Mission 3: 0.7 ~ 0.8 进入，0.85 离开
  const m3In = Math.max(0, Math.min(1, (p - 0.7) / 0.08))
  const m3Out = Math.max(0, Math.min(1, (p - 0.8) / 0.05))

  // Subscribe: 0.85 ~ 0.95 进入
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
        {/* 流线动效背景 — 视频加载前的视觉填充，视频加载后作为底层装饰 */}
        <div className="absolute inset-0" style={{ zIndex: 0, opacity: videosReady[0] ? 0.15 : 0.4 }}>
          <BackgroundPathsLayer />
        </div>

        {/* 3 个视频叠加 - 根据滚动进度显示对应视频（按需加载优化） */}
        {VIDEOS.map((src, i) => {
          // 只加载当前活跃视频和相邻视频，其余延迟加载
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
            onCanPlay={() => setVideosReady((r) => { const n = [...r]; n[i] = true; return n }) }
            onError={() => { console.warn("[Bloom] video error", src); setVideosReady((r) => { const n = [...r]; n[i] = true; return n }) } }
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === activeIdx ? 1 : 0,
              transition: "opacity 0.5s ease",
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
                    marginTop: "20px",
                    fontWeight: 400,
                  }}
                >
                  AI 驱动的间隔重复系统，在记忆即将消退的瞬间智能触发复习。基于 SM-2 算法与艾宾浩斯遗忘曲线，让学习效率提升 200%，每一份知识都被牢牢记住。
                </p>

                <div className="flex items-center gap-4 mt-8">
              <button
                onClick={onCtaClick}
                className="group relative w-14 h-14 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90"
                style={{
                  background: "#cb8dff",
                  color: "white",
                  boxShadow: "0 8px 28px rgba(203,141,255,0.45), inset 0 1px 0 rgba(255,255,255,0.3)",
                  borderRadius: "50%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#d9a8ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#cb8dff")}
                aria-label="Explore features"
              >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 group-hover:translate-x-0.5 transition-transform">
                      <path d="M5 12 H19 M13 5 L20 12 L13 19" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span
                    style={{
                      fontFamily: "'Manrope', system-ui, sans-serif",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.75)",
                      fontWeight: 500,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    向下滚动探索
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============== SECTION 2: FEATURES (0.12~0.42) ============== */}
        {featVisible && (
          <div
            className="absolute z-20 inset-0 flex items-center justify-center px-4"
            style={{
              opacity: featProgress,
              filter: `blur(${featBlur}px)`,
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[900px] w-full">
              {[
                {
                  title: "智能解析",
                  desc: "AI 自动解析你的笔记、PDF 与图片，构建完整的知识图谱。让每一个概念都连接到你的认知网络。",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /></svg>,
                },
                {
                  title: "记忆宫殿",
                  desc: "沉浸式 3D 知识图谱，节点径向布局、自动旋转、粒子流动连线。把你的知识画成一片璀璨的星空。",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z" /><circle cx="12" cy="12" r="2" /></svg>,
                },
                {
                  title: "智能复习",
                  desc: "基于 SM-2 算法动态调整每次复习间隔，错题自动入错题本并由 AI 诊断薄弱环节。复习从此高效。",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7"><path d="M13 2 L4 14 L11 14 L9 22 L20 9 L13 9 Z" /></svg>,
                },
              ].map((f, i) => {
                const dx = i === 0 ? featCard1X : i === 2 ? featCard3X : 0
                const dy = i === 1 ? featCard2Y : 0
                return (
                  <div
                    key={f.title}
                    className="p-8 flex flex-col gap-4"
                    style={{
                      background: "rgba(255,255,255,0.32)",
                      backdropFilter: "blur(80px) saturate(180%)",
                      WebkitBackdropFilter: "blur(80px) saturate(180%)",
                      border: "1px solid rgba(255,255,255,0.45)",
                      borderRadius: 28,
                      boxShadow: "0 16px 50px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
                      height: 440,
                      transform: `translate3d(${dx}px, ${dy}px, 0)`,
                      color: "white",
                      opacity: featProgress,
                    }}
                  >
                    <div style={{ color: "#cb8dff" }}>{f.icon}</div>
                    <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "26px", fontWeight: 400, margin: 0, lineHeight: 1.2 }}>{f.title}</h3>
                    <p style={{ fontFamily: "'Manrope', system-ui, sans-serif", fontSize: "13px", lineHeight: 1.7, color: "rgba(255,255,255,0.75)", margin: 0 }}>{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ============== SECTION 3: MISSION 1 (0.4~0.55) ============== */}
        <p
          className="absolute z-20 text-center px-4"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: "clamp(28px, 4.5vw, 56px)",
            lineHeight: 1.3,
            color: "white",
            maxWidth: "1100px",
            inset: 0,
            margin: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            opacity: m1In * (1 - m1Out),
            transform: `translateY(${(1 - m1In) * 30}px)`,
            transition: "opacity 0.05s linear",
            pointerEvents: "none",
          }}
        >
          在<span style={{ background: "#cb8dff", color: "white", padding: "2px 16px", borderRadius: 999, fontStyle: "italic", margin: "0 4px", display: "inline-block" }}>遗忘</span>与精通之间，架起记忆的桥梁
        </p>

        {/* ============== SECTION 4: MISSION 2 (0.55~0.7) ============== */}
        <p
          className="absolute z-20 text-center px-4"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: "clamp(28px, 4.5vw, 56px)",
            lineHeight: 1.3,
            color: "white",
            maxWidth: "1100px",
            inset: 0,
            margin: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            opacity: m2In * (1 - m2Out),
            transform: `translateY(${(1 - m2In) * 30}px)`,
            transition: "opacity 0.05s linear",
            pointerEvents: "none",
          }}
        >
          你学过的每一个<span style={{ background: "#cb8dff", color: "white", padding: "2px 16px", borderRadius: 999, fontStyle: "italic", margin: "0 4px", display: "inline-block" }}>概念</span>，都会成为你知识银河里的一颗星
        </p>

        {/* ============== SECTION 5: MISSION 3 (0.7~0.85) ============== */}
        <p
          className="absolute z-20 text-center px-4"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: "clamp(28px, 4.5vw, 56px)",
            lineHeight: 1.3,
            color: "white",
            maxWidth: "1100px",
            inset: 0,
            margin: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            opacity: m3In * (1 - m3Out),
            transform: `translateY(${(1 - m3In) * 30}px)`,
            transition: "opacity 0.05s linear",
            pointerEvents: "none",
          }}
        >
          每次<span style={{ background: "#cb8dff", color: "white", padding: "2px 16px", borderRadius: 999, fontStyle: "italic", margin: "0 4px", display: "inline-block" }}>复习</span>都是一次安静的智慧修行，构筑永不遗忘的脑
        </p>

        {/* ============== SECTION 6: SUBSCRIBE (0.85~1.0) ============== */}
        <div
          className="absolute z-20 inset-0 flex items-center justify-center px-4"
          style={{
            opacity: formProgress,
            transform: `translateY(${(1 - formProgress) * 40}px)`,
            pointerEvents: formProgress > 0.6 ? "auto" : "none",
          }}
        >
          <form onSubmit={handleSubscribe} className="w-full max-w-md p-10 flex flex-col items-center" style={{ background: "rgba(20,20,30,0.45)", backdropFilter: "blur(48px) saturate(180%)", WebkitBackdropFilter: "blur(48px) saturate(180%)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 28, color: "white", boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
            <svg viewBox="0 0 32 32" className="w-10 h-10 mb-4" fill="white">
              <path d="M16 4 C19 9 22 11 27 12 C22 13 19 15 16 20 C13 15 10 13 5 12 C10 11 13 9 16 4 Z" />
              <circle cx="16" cy="16" r="1.5" />
            </svg>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "32px", fontWeight: 400, margin: 0, marginBottom: 8 }}>开启记忆之旅</h2>
            <p style={{ fontFamily: "'Manrope', system-ui, sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.7)", margin: 0, marginBottom: 24, textAlign: "center" }}>订阅记忆科学周报，接收高效学习技巧与产品更新。</p>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@memory.star" className="w-full px-4 py-3 mb-3 outline-none" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "white", fontFamily: "'Manrope', system-ui, sans-serif", fontSize: "14px", borderRadius: 14 }} />
            <button type="submit" className="w-full py-3 transition-all hover:scale-[1.02] active:scale-95" style={{ background: submitted ? "#059669" : "#cb8dff", color: "white", fontFamily: "'Manrope', system-ui, sans-serif", fontSize: "13px", fontWeight: 600, letterSpacing: "0.1em", borderRadius: 14, border: "none", cursor: "pointer", textTransform: "uppercase", boxShadow: submitted ? "0 8px 24px rgba(5,150,105,0.3)" : "0 8px 24px rgba(203,141,255,0.35)" }}>{submitted ? "✓ 欢迎加入" : "立即开始"}</button>
            {submitted && <p style={{ fontFamily: "'Manrope', system-ui, sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: 16, textAlign: "center" }}>欢迎加入记忆探索者，第一次复习已为你准备好。</p>}
          </form>
        </div>

        {/* Loading overlay - 视频未就绪且尚未超时时显示 */}
        {!videosReady[0] && !hasOpened && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #12121f 40%, #0d0d18 70%, #08080f 100%)" }}>
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" style={{ animationDuration: "1s" }} />
            <p className="mt-6 text-sm tracking-widest" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Manrope', system-ui, sans-serif", fontSize: "11px", letterSpacing: "0.2em" }}>加载体验中</p>
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

      <style>{`
        @keyframes scrollHint {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(12px); opacity: 0; }
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
        html { scrollbar-color: #2a2a2a #000; scrollbar-width: thin; }
        ::selection { background: rgba(203,141,255,0.3); color: white; }
      `}</style>
    </div>
  )
}