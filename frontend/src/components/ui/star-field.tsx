import { useRef, useEffect } from "react"

interface Star {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  alpha: number
  alphaDir: number
  color: string
}

const STAR_COLORS = [
  "rgba(255, 255, 255, ",
  "rgba(99, 102, 241, ",
  "rgba(139, 92, 246, ",
  "rgba(168, 85, 247, ",
  "rgba(236, 72, 153, ",
]

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Generate stars
    const count = Math.min(120, Math.floor((window.innerWidth * window.innerHeight) / 12000))
    starsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.05,
      alpha: Math.random() * 0.5 + 0.1,
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      starsRef.current.forEach((star) => {
        star.x += star.vx
        star.y += star.vy
        star.alpha += star.alphaDir * 0.003
        if (star.alpha > 0.7) star.alphaDir = -1
        if (star.alpha < 0.05) star.alphaDir = 1

        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx.fillStyle = star.color + star.alpha + ")"
        ctx.fill()

        // Glow effect for larger stars
        if (star.r > 1) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2)
          ctx.fillStyle = star.color + (star.alpha * 0.1) + ")"
          ctx.fill()
        }
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  )
}
