import { useRef, useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"

/**
 * BackgroundPaths — SVG 流动路径背景动画（性能优化版）
 *
 * 优化措施：
 * - 路径数量从 36→12（总量 72→24），降低 67% 渲染负载
 * - useMemo 缓存路径数据，避免每次渲染重建
 * - IntersectionObserver 离屏暂停动画
 * - 预计算 duration，避免 render 中 Math.random
 * - will-change 提示 GPU 合成层
 * - reduced-motion 降级
 */

const PATH_COUNT = 12

function FloatingPaths({
  position,
  visible,
  vibrant = false,
}: {
  position: number
  visible: boolean
  vibrant?: boolean
}) {
  const opacityBase = vibrant ? 0.12 : 0.05
  const opacityStep = vibrant ? 0.03 : 0.015

  // 预计算路径数据和动画时长，避免 render 中随机
  const paths = useMemo(() => {
    return Array.from({ length: PATH_COUNT }, (_, i) => ({
      id: i,
      d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
        380 - i * 5 * position
      } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
        152 - i * 5 * position
      } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
        684 - i * 5 * position
      } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
      width: 0.5 + i * 0.03,
      duration: 20 + ((i * 7 + position * 13) % 10),
    }))
  }, [position])

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full text-slate-900"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        style={{ willChange: "transform" }}
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={opacityBase + path.id * opacityStep}
            initial={{ pathLength: 0.3, opacity: 0.4 }}
            animate={
              visible
                ? {
                    pathLength: 1,
                    opacity: [0.2, 0.5, 0.2],
                    pathOffset: [0, 1, 0],
                  }
                : { opacity: 0 }
            }
            transition={{
              duration: path.duration,
              repeat: visible ? Number.POSITIVE_INFINITY : 0,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  )
}

/** 仅渲染流动路径背景层 — 用于嵌入其他页面作为装饰背景 */
export function BackgroundPathsLayer({
  className = "",
  vibrant = false,
}: {
  className?: string
  vibrant?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // prefers-reduced-motion 时直接不渲染动画
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisible(entries[0]?.isIntersecting ?? true)
      },
      { threshold: 0.01, rootMargin: "100px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      <FloatingPaths position={1} visible={visible} vibrant={vibrant} />
      <FloatingPaths position={-1} visible={visible} vibrant={vibrant} />
    </div>
  )
}

/** 完整 Hero 区域 — 带标题动画 */
export function BackgroundPaths({
  title = "Background Paths",
}: {
  title?: string
}) {
  const words = title.split(" ")

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-ink-900">
      <BackgroundPathsLayer />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200, 121, 65, 0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-bold mb-8 tracking-tighter">
            {words.map((word, wordIndex) => (
              <span
                key={wordIndex}
                className="inline-block mr-4 last:mr-0"
              >
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-paper-50 via-paper-200 to-amber-light/60"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>
        </motion.div>
      </div>
    </div>
  )
}
