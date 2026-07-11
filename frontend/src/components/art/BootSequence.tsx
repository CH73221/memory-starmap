import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { BackgroundPathsLayer } from "@/components/ui/background-paths"

/**
 * 记忆星图启动序列 · v6 白底 + motion 动效版
 * 纯排版动效，参照 ryden.co.jp 日式排版风格。
 * 白底 + 黑字 + 琥珀细线 + 流线背景。
 */

interface BootSequenceProps {
  originX?: number
  originY?: number
  onComplete?: () => void
  username?: string
}

const TOTAL_DURATION = 3600

export function BootSequence({
  originX: _originX = 0.5,
  originY: _originY = 0.5,
  onComplete,
  username,
}: BootSequenceProps) {
  const [dissolving, setDissolving] = useState(false)
  const [gone, setGone] = useState(false)
  const onCompleteRef = useRef<(() => void) | undefined>(undefined)
  onCompleteRef.current = onComplete

  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )

  useEffect(() => {
    if (prefersReducedMotion.current) {
      onCompleteRef.current?.()
      setGone(true)
      return
    }

    const dissolveTimer = window.setTimeout(() => setDissolving(true), 2900)
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current?.()
      setGone(true)
    }, TOTAL_DURATION)

    return () => {
      window.clearTimeout(dissolveTimer)
      window.clearTimeout(completeTimer)
    }
  }, [])

  if (prefersReducedMotion.current || gone) return null

  const titleChars = "记忆星图".split("")

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ overflow: "hidden", perspective: "1200px" }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{
          opacity: dissolving ? 0 : 1,
          y: dissolving ? -30 : 0,
          scale: dissolving ? 1.05 : 1,
        }}
        transition={{
          opacity: { duration: dissolving ? 0.7 : 0.4, ease: "easeOut" },
          y: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
        }}
        style={{
          background:
            "radial-gradient(ellipse at center, rgb(255, 255, 255) 0%, rgb(248, 250, 252) 60%, rgb(241, 245, 249) 100%)",
        }}
      >
        {/* 流线背景 */}
        <div className="absolute inset-0 opacity-40">
          <BackgroundPathsLayer vibrant />
        </div>

        {/* 中心内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {/* 琥珀线从中心展开 */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="origin-center"
            style={{
              width: "min(70%, 720px)",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, #c87941 30%, #b45309 50%, #c87941 70%, transparent)",
              marginBottom: "3rem",
            }}
          />

          {/* 主标题 — 逐字弹跳入场 + 字距收紧 */}
          <motion.h1
            className="font-display text-6xl md:text-8xl lg:text-9xl"
            initial={{ letterSpacing: "0.4em" }}
            animate={{ letterSpacing: "0.02em" }}
            transition={{ delay: 0.6, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontWeight: 800,
              color: "#0a0a0a",
            }}
          >
            {titleChars.map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: 80, opacity: 0, rotateX: -90 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                transition={{
                  delay: 0.6 + i * 0.12,
                  type: "spring",
                  stiffness: 130,
                  damping: 20,
                }}
                className="inline-block"
                style={{ transformOrigin: "bottom center" }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          {/* 装饰线 */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 40, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: "2px",
              background: "#c87941",
              marginTop: "1.5rem",
              marginBottom: "1.5rem",
            }}
          />

          {/* 副标题 */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="text-xs md:text-sm font-mono tracking-[0.5em] uppercase text-gray-400"
          >
            Memory Starmap
          </motion.p>

          {/* 欢迎语 */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="mt-8 text-2xl md:text-3xl font-display font-semibold"
            style={{ color: "#b45309" }}
          >
            {username ? username : "欢迎回来"}
          </motion.p>

          {/* 底部微标 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(0, 0, 0, 0.15)" }}
          >
            MAPS · AI Review Engine v2.0
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
