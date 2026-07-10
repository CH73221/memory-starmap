import { useRef, useEffect } from "react"

/**
 * 记忆星图生成艺术背景 · Memory Constellation Background
 *
 * 基于艾宾浩斯遗忘曲线 R = e^(-t/S) 的生成式动画。
 * 每个粒子是一段记忆痕迹，亮度随时间衰减；
 * 定期脉冲模拟 SM-2 间隔重复的"复习呼吸"；
 * 近邻粒子之间生成连线，编织出知识的星座网络。
 *
 * 用于登录页/仪表盘的装饰性背景层。
 */
interface MemoryConstellationBgProps {
  /** 粒子数量 */
  traceCount?: number
  /** 遗忘速率 (0.001~0.02) */
  forgetRate?: number
  /** 复习脉冲间隔（帧） */
  pulseInterval?: number
  /** 漂移速度 */
  flowSpeed?: number
  /** 连线距离 */
  connectDist?: number
  /** 拖尾褪色速度 */
  trailFade?: number
  /** 容器透明度 */
  opacity?: number
  className?: string
}

interface Trace {
  x: number
  y: number
  vx: number
  vy: number
  strength: number
  stability: number
  lastReview: number
  connections: number
  size: number
  noiseOffset: number
  age: number
}

export function MemoryConstellationBg({
  traceCount = 80,
  forgetRate = 0.004,
  pulseInterval = 300,
  flowSpeed = 0.6,
  connectDist = 120,
  trailFade = 20,
  opacity = 0.5,
  className = "",
}: MemoryConstellationBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const tracesRef = useRef<Trace[]>([])
  const frameRef = useRef(0)
  const pulseRef = useRef(0)
  const visibleRef = useRef(true)
  const lastDrawRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 色彩 — 晨雾纸页色板
    const inkR = 26, inkG = 26, inkB = 46     // #1a1a2e
    const amberR = 200, amberG = 121, amberB = 65 // #c87941
    const bgR = 250, bgG = 249, bgB = 247       // #faf9f7

    // 简易确定性伪随机
    let seed = 1885
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }

    // 简易 Perlin-like 噪声（基于正弦叠加的近似）
    const noise2D = (x: number, y: number, t: number) => {
      return (
        (Math.sin(x * 3.7 + t * 1.3) + Math.sin(y * 2.9 + t * 0.8) + Math.sin((x + y) * 1.8 + t * 0.5)) / 3
      )
    }

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = parent.offsetWidth * dpr
      canvas.height = parent.offsetHeight * dpr
      canvas.style.width = parent.offsetWidth + "px"
      canvas.style.height = parent.offsetHeight + "px"
      ctx.scale(dpr, dpr)
    }

    const initTraces = () => {
      const w = canvas.width / (window.devicePixelRatio || 1)
      const h = canvas.height / (window.devicePixelRatio || 1)
      seed = 1885
      tracesRef.current = []
      for (let i = 0; i < traceCount; i++) {
        tracesRef.current.push({
          x: seededRandom() * w,
          y: seededRandom() * h,
          vx: 0,
          vy: 0,
          strength: 0.5 + seededRandom() * 0.5,
          stability: 50 + seededRandom() * 100,
          lastReview: 0,
          connections: 0,
          size: 1.5 + seededRandom() * 3,
          noiseOffset: seededRandom() * 1000,
          age: 0,
        })
      }
    }

    const draw = () => {
      // 当页面不可见时暂停动画（性能优化）
      if (!visibleRef.current) {
        animRef.current = requestAnimationFrame(draw)
        return
      }

      // 帧率限制 — 背景动画不需要 60fps，30fps 足够流畅
      const now = performance.now()
      if (now - lastDrawRef.current < 33) {
        animRef.current = requestAnimationFrame(draw)
        return
      }
      lastDrawRef.current = now

      const w = canvas.width / (window.devicePixelRatio || 1)
      const h = canvas.height / (window.devicePixelRatio || 1)
      const frame = frameRef.current

      // 拖尾褪色
      ctx.fillStyle = `rgba(${bgR},${bgG},${bgB},${trailFade / 255})`
      ctx.fillRect(0, 0, w, h)

      frameRef.current++

      // 间隔重复脉冲
      const pulsePhase = frame % pulseInterval
      pulseRef.current = pulsePhase < 30 ? 1.0 - pulsePhase / 30 : 0
      const pulseWave = pulseRef.current

      const traces = tracesRef.current

      // 更新粒子
      for (const t of traces) {
        t.age++
        const angle = noise2D(
          t.x * 0.006,
          t.y * 0.006,
          t.noiseOffset * 0.01 + frame * 0.002
        ) * Math.PI * 2

        t.vx = Math.cos(angle) * flowSpeed
        t.vy = Math.sin(angle) * flowSpeed
        t.x += t.vx
        t.y += t.vy

        if (t.x < -20) t.x = w + 20
        if (t.x > w + 20) t.x = -20
        if (t.y < -20) t.y = h + 20
        if (t.y > h + 20) t.y = -20

        // 艾宾浩斯遗忘曲线
        const timeSinceReview = frame - t.lastReview
        t.strength = Math.exp(-timeSinceReview * forgetRate / (t.stability / 100))

        // 脉冲触发复习
        if (pulseWave > 0 && t.strength < 0.35) {
          if (seededRandom() < pulseWave * 0.2) {
            t.strength = 0.7 + seededRandom() * 0.3
            t.lastReview = frame
            t.stability += 5 + seededRandom() * 10
          }
        }
      }

      // 重置连接数
      for (const t of traces) t.connections = 0

      // 绘制连线
      for (let i = 0; i < traces.length; i++) {
        for (let j = i + 1; j < traces.length; j++) {
          const dx = traces[i].x - traces[j].x
          const dy = traces[i].y - traces[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectDist) {
            traces[i].connections++
            traces[j].connections++

            const combinedStrength = (traces[i].strength + traces[j].strength) / 2
            const distFactor = 1 - dist / connectDist
            const lineAlpha = combinedStrength * distFactor * 80 * opacity

            if (lineAlpha > 1) {
              const isHubLine = traces[i].connections > 4 || traces[j].connections > 4
              const r = isHubLine ? amberR : inkR
              const g = isHubLine ? amberG : inkG
              const b = isHubLine ? amberB : inkB

              ctx.strokeStyle = `rgba(${r},${g},${b},${lineAlpha / 255})`
              ctx.lineWidth = combinedStrength * 0.8
              ctx.beginPath()
              ctx.moveTo(traces[i].x, traces[i].y)
              ctx.lineTo(traces[j].x, traces[j].y)
              ctx.stroke()
            }
          }
        }
      }

      // 绘制粒子
      for (const t of traces) {
        const isHub = t.connections > 5
        const r = isHub ? amberR : inkR
        const g = isHub ? amberG : inkG
        const b = isHub ? amberB : inkB
        const alpha = t.strength * 255 * opacity
        const displaySize = t.size * (0.5 + t.strength * 0.8)

        // 外层光晕
        ctx.fillStyle = `rgba(${r},${g},${b},${(t.strength * 40 * opacity) / 255})`
        ctx.beginPath()
        ctx.arc(t.x, t.y, displaySize * 3.5, 0, Math.PI * 2)
        ctx.fill()

        // 中层
        ctx.fillStyle = `rgba(${r},${g},${b},${(t.strength * 80 * opacity) / 255})`
        ctx.beginPath()
        ctx.arc(t.x, t.y, displaySize * 2, 0, Math.PI * 2)
        ctx.fill()

        // 核心
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha / 255})`
        ctx.beginPath()
        ctx.arc(t.x, t.y, displaySize, 0, Math.PI * 2)
        ctx.fill()

        // 枢纽星额外光晕
        if (isHub && t.strength > 0.3) {
          ctx.fillStyle = `rgba(${amberR},${amberG},${amberB},${(t.strength * 25 * opacity) / 255})`
          ctx.beginPath()
          ctx.arc(t.x, t.y, displaySize * 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // 脉冲波纹
      if (pulseWave > 0) {
        const rippleR = (1.0 - pulseWave) * Math.max(w, h) * 0.7
        ctx.strokeStyle = `rgba(${amberR},${amberG},${amberB},${(pulseWave * 25 * opacity) / 255})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, rippleR, 0, Math.PI * 2)
        ctx.stroke()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    resize()
    initTraces()
    draw()

    const handleResize = () => {
      resize()
      initTraces()
    }
    window.addEventListener("resize", handleResize)

    // 页面可见性监听 — 切换标签页时暂停动画
    const handleVisibility = () => {
      visibleRef.current = document.visibilityState === "visible"
    }
    document.addEventListener("visibilitychange", handleVisibility)

    // IntersectionObserver — 元素离开视口时暂停
    const observer = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries[0]?.isIntersecting ?? true
      },
      { threshold: 0 }
    )
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibility)
      observer.disconnect()
    }
  }, [traceCount, forgetRate, pulseInterval, flowSpeed, connectDist, trailFade, opacity])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    />
  )
}
