import { useRef, useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"

/**
 * BackgroundPaths — SVG 流动路径背景动画
 *
 * 核心原理：
 * - 手动设置 strokeDasharray（像素值）+ 动画 strokeDashoffset 实现流动
 * - 不依赖 framer-motion pathLength（存在浏览器兼容问题）
 * - strokeDashoffset 从 0 → -patternLength 循环，创造持续向前流动
 * - viewBox="0 0 696 316" 是视口窗口，路径坐标远大于此
 * - preserveAspectRatio="xMidYMid slice" 确保填满屏幕
 *
 * 性能优化：
 * - useMemo 缓存路径数据
 * - IntersectionObserver 离屏暂停
 * - 预计算 duration，避免 render 中 Math.random
 * - reduced-motion 降级
 */

const PATH_COUNT = 36

// 所有路径形状相似（仅偏移不同），总长度约 ~1580px
// 使用固定 pattern 长度确保无缝循环
const PATTERN_LENGTH = 1600

function FloatingPaths({
  position,
  visible,
  vibrant = false,
}: {
  position: number
  visible: boolean
  vibrant?: boolean
}) {
  // vibrant 模式：更高的 stroke opacity 和 width，适合白底
  const opacityBase = vibrant ? 0.3 : 0.1
  const opacityStep = vibrant ? 0.02 : 0.03
  const widthBase = vibrant ? 1.5 : 0.5
  const widthStep = vibrant ? 0.04 : 0.03
  const animOpacity = vibrant ? [0.5, 1, 0.5] : [0.3, 0.6, 0.3]

  // 预计算路径数据和动画时长
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
      width: widthBase + i * widthStep,
      strokeOpacity: opacityBase + i * opacityStep,
      duration: 20 + ((i * 7 + position * 13) % 10),
      // 可见段长度（占总长 25%-45%，随机化让不同路径不同步）
      dashLength: 400 + ((i * 37 + position * 53) % 300),
      // 起始偏移（让不同路径的流动起点不同）
      offsetStart: ((i * 97 + position * 61) % PATTERN_LENGTH),
    }))
  }, [position, vibrant, opacityBase, opacityStep, widthBase, widthStep])

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full text-slate-950"
        viewBox="-450 -270 1200 1200"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>Background Paths</title>
        {paths.map((path) => {
          const gapLength = PATTERN_LENGTH - path.dashLength
          return (
            <motion.path
              key={path.id}
              d={path.d}
              stroke="currentColor"
              strokeWidth={path.width}
              strokeOpacity={path.strokeOpacity}
              // 固定 dasharray：dashLength 可见 + gapLength 间隙
              style={{
                strokeDasharray: `${path.dashLength} ${gapLength}`,
              }}
              initial={{ strokeDashoffset: path.offsetStart, opacity: 0 }}
              animate={
                visible
                  ? {
                      strokeDashoffset: [
                        path.offsetStart,
                        path.offsetStart - PATTERN_LENGTH,
                      ],
                      opacity: animOpacity,
                    }
                  : { opacity: 0 }
              }
              transition={{
                duration: path.duration,
                repeat: visible ? Number.POSITIVE_INFINITY : 0,
                ease: "linear",
              }}
            />
          )
        })}
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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0">
        <FloatingPaths position={1} visible={true} />
        <FloatingPaths position={-1} visible={true} />
      </div>

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
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80 dark:from-white dark:to-white/80"
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
