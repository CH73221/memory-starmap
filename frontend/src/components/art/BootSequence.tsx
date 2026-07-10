import { useRef, useEffect, useState, useCallback } from "react"

/**
 * 记忆星图启动序列 · Memory Starmap Boot Sequence v2
 *
 * 登录成功后的 LOGO 变体欢迎过渡动画，参照 zeitmedia.vn 大字排版风格。
 *
 * 5 个阶段：
 * 1. Iris Close    (0.0-0.4s)  圆形从按钮位置扩展，墨蓝色覆盖屏幕
 * 2. Star Warp     (0.2-1.0s)  星点从中心向外加速飞射（超光速效果）
 * 3. Convergence   (0.8-1.5s)  粒子减速并汇聚向中心，形成星座
 * 4. Logo Variant  (1.3-2.6s)  LOGO 变体形变 + 大字排版逐字弹入
 * 5. Iris Open     (2.4-3.2s)  幕布从中心打开，露出仪表盘
 */

type Phase = "idle" | "iris-close" | "star-warp" | "convergence" | "logo-variant" | "iris-open" | "done"

interface WarpStar {
  x: number
  y: number
  vx: number
  vy: number
  prevX: number
  prevY: number
  size: number
  brightness: number
  isHub: boolean
  targetX: number
  targetY: number
  converging: boolean
}

interface BootSequenceProps {
  originX?: number
  originY?: number
  onComplete?: () => void
  username?: string
}

const TOTAL_DURATION = 3300

export function BootSequence({
  originX = 0.5,
  originY = 0.5,
  onComplete,
  username,
}: BootSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const lastFrameRef = useRef<number>(0)
  const starsRef = useRef<WarpStar[]>([])
  const phaseRef = useRef<Phase>("idle")
  const onCompleteRef = useRef<(() => void) | undefined>(undefined)
  const [showLogo, setShowLogo] = useState(false)
  const [logoVisible, setLogoVisible] = useState(false)
  const [logoDissolving, setLogoDissolving] = useState(false)
  const [overlayGone, setOverlayGone] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  onCompleteRef.current = onComplete

  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )

  const initStars = useCallback((w: number, h: number) => {
    const count = 180
    const cx = w * originX
    const cy = h * originY
    const stars: WarpStar[] = []

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3
      const speed = 2 + Math.random() * 8
      const targetRadius = 60 + Math.random() * 120
      const targetAngle = Math.random() * Math.PI * 2

      stars.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        prevX: cx,
        prevY: cy,
        size: 1 + Math.random() * 2.5,
        brightness: 0.5 + Math.random() * 0.5,
        isHub: i % 20 === 0,
        targetX: cx + Math.cos(targetAngle) * targetRadius,
        targetY: cy + Math.sin(targetAngle) * targetRadius,
        converging: false,
      })
    }
    starsRef.current = stars
  }, [originX, originY])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 帧率限制：30fps 足够流畅渲染粒子动画，降低 50% CPU 负载
    const now = performance.now()
    if (now - lastFrameRef.current < 33) {
      animRef.current = requestAnimationFrame(animate)
      return
    }
    lastFrameRef.current = now

    const w = canvas.width / (window.devicePixelRatio || 1)
    const h = canvas.height / (window.devicePixelRatio || 1)
    const elapsed = performance.now() - startTimeRef.current
    const cx = w * originX
    const cy = h * originY

    let phase: Phase = "iris-close"
    if (elapsed < 400) phase = "iris-close"
    else if (elapsed < 1000) phase = "star-warp"
    else if (elapsed < 1500) phase = "convergence"
    else if (elapsed < 2600) phase = "logo-variant"
    else if (elapsed < 3200) phase = "iris-open"
    else phase = "done"

    if (phase !== phaseRef.current) {
      phaseRef.current = phase

      if (phase === "convergence") {
        for (const s of starsRef.current) {
          s.converging = true
        }
      }

      if (phase === "logo-variant") {
        setShowLogo(true)
        setShowProgress(true)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setLogoVisible(true))
        })
        // 延迟显示欢迎语
        setTimeout(() => setShowWelcome(true), 800)
      }

      if (phase === "iris-open") {
        if (overlayRef.current) {
          overlayRef.current.style.clipPath = `circle(0% at ${originX * 100}% ${originY * 100}%)`
        }
        setLogoDissolving(true)
        import("canvas-confetti").then(({ default: confetti }) => {
          const starShape = confetti.shapeFromText({ text: "★", scalar: 1.2 })
          confetti({
            particleCount: 40,
            spread: 360,
            startVelocity: 25,
            ticks: 80,
            origin: { x: originX, y: originY },
            colors: ["#c87941", "#e8a87c", "#1a1a2e", "#9898b5"],
            shapes: [starShape, "circle"],
            scalar: 0.8,
            disableForReducedMotion: true,
          })
        })
      }

      if (phase === "done") {
        setOverlayGone(true)
        if (onCompleteRef.current) onCompleteRef.current()
        return
      }
    }

    if (phase === "star-warp" || phase === "convergence") {
      ctx.fillStyle = "rgba(10, 10, 20, 0.15)"
      ctx.fillRect(0, 0, w, h)
    } else {
      ctx.clearRect(0, 0, w, h)
    }

    const stars = starsRef.current

    for (const s of stars) {
      s.prevX = s.x
      s.prevY = s.y

      if (phase === "star-warp") {
        const speedMul = 1 + (elapsed - 400) / 600 * 0.5
        s.x += s.vx * speedMul
        s.y += s.vy * speedMul
      } else if (phase === "convergence") {
        const dx = s.targetX - s.x
        const dy = s.targetY - s.y
        const ease = 0.08
        s.vx = s.vx * 0.85 + dx * ease
        s.vy = s.vy * 0.85 + dy * ease
        s.x += s.vx
        s.y += s.vy
      } else if (phase === "logo-variant" || phase === "iris-open") {
        const dx = s.targetX - s.x
        const dy = s.targetY - s.y
        s.x += dx * 0.03 + (Math.random() - 0.5) * 0.3
        s.y += dy * 0.03 + (Math.random() - 0.5) * 0.3
      }

      if (phase === "star-warp") {
        const trailLen = Math.min(
          Math.sqrt((s.x - s.prevX) ** 2 + (s.y - s.prevY) ** 2) * 1.5,
          40
        )
        const angle = Math.atan2(s.vy, s.vx)
        const tailX = s.x - Math.cos(angle) * trailLen
        const tailY = s.y - Math.sin(angle) * trailLen

        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY)
        grad.addColorStop(0, `rgba(232, 168, 124, ${s.brightness})`)
        grad.addColorStop(1, "rgba(232, 168, 124, 0)")

        ctx.strokeStyle = grad
        ctx.lineWidth = s.size
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()
      } else {
        const fadeMul = phase === "iris-open"
          ? Math.max(0, 1 - (elapsed - 2600) / 600)
          : 1
        const r = s.isHub ? 200 : 26
        const g = s.isHub ? 121 : 26
        const b = s.isHub ? 65 : 46
        const brightness = s.brightness * fadeMul

        ctx.fillStyle = `rgba(${r},${g},${b},${brightness * 0.15})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(${r},${g},${b},${brightness})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (phase === "convergence" || phase === "logo-variant" || phase === "iris-open") {
      const lineAlpha = phase === "convergence"
        ? Math.min((elapsed - 1000) / 500, 1) * 0.3
        : phase === "logo-variant"
          ? 0.3 * Math.max(0, 1 - (elapsed - 1500) / 800)
          : 0.1

      if (lineAlpha > 0.01) {
        ctx.strokeStyle = `rgba(200, 121, 65, ${lineAlpha})`
        ctx.lineWidth = 0.5

        // 优化：平方距离比较 + 批量 stroke，避免 O(n²) 中每对调用 stroke
        const maxDist = 80
        const maxDistSq = maxDist * maxDist
        ctx.beginPath()
        for (let i = 0; i < stars.length; i++) {
          const si = stars[i]
          for (let j = i + 1; j < stars.length; j++) {
            const sj = stars[j]
            const dx = si.x - sj.x
            const dy = si.y - sj.y
            const distSq = dx * dx + dy * dy
            if (distSq < maxDistSq) {
              ctx.moveTo(si.x, si.y)
              ctx.lineTo(sj.x, sj.y)
            }
          }
        }
        ctx.stroke()
      }
    }

    animRef.current = requestAnimationFrame(animate)
  }, [originX, originY])

  useEffect(() => {
    if (prefersReducedMotion.current) {
      if (onCompleteRef.current) onCompleteRef.current()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + "px"
      canvas.style.height = window.innerHeight + "px"
      ctx.scale(dpr, dpr)
    }

    resize()
    initStars(window.innerWidth, window.innerHeight)

    if (overlayRef.current) {
      overlayRef.current.style.clipPath = `circle(0% at ${originX * 100}% ${originY * 100}%)`
      void overlayRef.current.offsetHeight
      overlayRef.current.style.transition = "clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      overlayRef.current.style.clipPath = `circle(150% at ${originX * 100}% ${originY * 100}%)`
    }

    startTimeRef.current = performance.now()
    animate()

    const handleResize = () => resize()
    window.addEventListener("resize", handleResize)

    const timeout = setTimeout(() => {
      cancelAnimationFrame(animRef.current)
    }, TOTAL_DURATION + 200)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeout)
    }
  }, [animate, initStars, originX, originY])

  const handleIrisOpenTransition = () => {
    if (phaseRef.current === "iris-open") {
      setOverlayGone(true)
    }
  }

  if (overlayGone || prefersReducedMotion.current) return null

  // LOGO 标题文字逐字弹入
  const titleChars = "记忆星图".split("")

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ overflow: "hidden" }}
    >
      {/* 墨蓝遮幕 */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{
          backgroundColor: "#0a0a14",
          clipPath: "circle(0% at 50% 50%)",
          transition: "clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onTransitionEnd={handleIrisOpenTransition}
      />

      {/* Canvas 粒子动画 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ pointerEvents: "none" }}
      />

      {/* LOGO 变体揭示 */}
      {showLogo && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center ${logoDissolving ? "logo-dissolve" : ""}`}
          style={{
            opacity: logoVisible ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        >
          {/* 径向光晕 */}
          <div
            className="absolute"
            style={{
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(200, 121, 65, 0.12) 0%, rgba(200, 121, 65, 0) 70%)",
              opacity: logoVisible ? 1 : 0,
              transition: "opacity 0.8s ease 0.2s",
            }}
          />

          {/* LOGO 变体 — 星座形态 SVG */}
          <div className="relative mb-8 logo-variant-morph">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              {/* 星座连线 */}
              <line x1="40" y1="10" x2="40" y2="70" stroke="#c87941" strokeWidth="0.5" opacity="0.3" className="constellation-form" style={{ animationDelay: "0s" }} />
              <line x1="10" y1="40" x2="70" y2="40" stroke="#c87941" strokeWidth="0.5" opacity="0.3" className="constellation-form" style={{ animationDelay: "0.1s" }} />
              <line x1="18" y1="18" x2="62" y2="62" stroke="#c87941" strokeWidth="0.5" opacity="0.2" className="constellation-form" style={{ animationDelay: "0.2s" }} />
              <line x1="62" y1="18" x2="18" y2="62" stroke="#c87941" strokeWidth="0.5" opacity="0.2" className="constellation-form" style={{ animationDelay: "0.3s" }} />

              {/* 星座节点 */}
              <circle cx="40" cy="10" r="2.5" fill="#e8a87c">
                <animate attributeName="r" values="0;2.5" dur="0.3s" begin="0.2s" fill="freeze" />
              </circle>
              <circle cx="40" cy="70" r="2.5" fill="#e8a87c">
                <animate attributeName="r" values="0;2.5" dur="0.3s" begin="0.3s" fill="freeze" />
              </circle>
              <circle cx="10" cy="40" r="2.5" fill="#e8a87c">
                <animate attributeName="r" values="0;2.5" dur="0.3s" begin="0.4s" fill="freeze" />
              </circle>
              <circle cx="70" cy="40" r="2.5" fill="#e8a87c">
                <animate attributeName="r" values="0;2.5" dur="0.3s" begin="0.5s" fill="freeze" />
              </circle>

              {/* 中心星形 */}
              <circle cx="40" cy="40" r="4" fill="#c87941">
                <animate attributeName="r" values="0;4" dur="0.4s" begin="0.6s" fill="freeze" />
                <animate attributeName="opacity" values="0;1" dur="0.3s" begin="0.6s" fill="freeze" />
              </circle>

              {/* 外圈光环 */}
              <circle cx="40" cy="40" r="14" stroke="#c87941" strokeWidth="0.5" fill="none" opacity="0.15">
                <animate attributeName="r" values="4;14" dur="0.6s" begin="0.8s" fill="freeze" />
                <animate attributeName="opacity" values="0;0.15" dur="0.4s" begin="0.8s" fill="freeze" />
              </circle>
            </svg>
          </div>

          {/* 大号标题 — 逐字弹入 */}
          <h1
            className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-4"
            style={{
              color: "#faf9f7",
              textShadow: "0 0 40px rgba(200, 121, 65, 0.25)",
            }}
          >
            {titleChars.map((char, i) => (
              <span
                key={i}
                className="boot-letter"
                style={{ animationDelay: `${0.3 + i * 0.08}s` }}
              >
                {char}
              </span>
            ))}
          </h1>

          {/* 副标题 — 大写英文 */}
          <p
            className="text-xs md:text-sm font-mono tracking-[0.4em] uppercase mb-8"
            style={{
              color: "rgba(232, 168, 124, 0.5)",
              opacity: logoVisible ? 1 : 0,
              transition: "opacity 0.6s ease 0.8s",
            }}
          >
            Memory Starmap
          </p>

          {/* 欢迎语 */}
          {showWelcome && (
            <div className="welcome-slide-up text-center" style={{ animationDelay: "0.2s" }}>
              <p
                className="text-2xl md:text-3xl font-display font-semibold"
                style={{
                  color: "#e8a87c",
                  textShadow: "0 0 24px rgba(232, 168, 124, 0.2)",
                }}
              >
                {username ? `欢迎回来，${username}` : "点亮知识星空"}
              </p>
              <p
                className="mt-3 text-xs font-mono tracking-[0.3em] uppercase"
                style={{ color: "rgba(152, 152, 181, 0.4)" }}
              >
                Welcome Back
              </p>
            </div>
          )}

          {/* 进度条 */}
          {showProgress && (
            <div
              className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48"
              style={{
                opacity: logoVisible ? 1 : 0,
                transition: "opacity 0.4s ease 1s",
              }}
            >
              <div className="h-px bg-white/5 rounded-full overflow-hidden">
                <div className="boot-progress-bar h-full bg-gradient-to-r from-amber to-amber-light rounded-full" />
              </div>
              <p
                className="text-center mt-3 text-[10px] font-mono tracking-[0.3em] uppercase"
                style={{ color: "rgba(152, 152, 181, 0.3)" }}
              >
                Initializing System
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
