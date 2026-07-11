import { useEffect, useRef, useState } from "react"

/**
 * 记忆星图启动序列 · Memory Starmap Boot Sequence v3
 *
 * 品牌 LOGO 动画，参照 ryden.co.jp 日式创意 agency 大字排版风格。
 * 纯 CSS/SVG 排版驱动，无 canvas / 粒子 / 星轨。
 *
 * 6 个阶段（总计约 3.4s）：
 * 1. Overlay In   (0.0-0.3s)  深色遮幕淡入
 * 2. Line Draw    (0.3-0.8s)  琥珀细线从左向右画出
 * 3. Title Reveal (0.6-1.6s)  "记忆星图" 逐字遮罩揭示 + 字距由宽收紧
 * 4. Subtitle     (1.4-1.8s)  "MEMORY STARMAP" 副标题淡入
 * 5. Welcome      (1.8-2.4s)  欢迎语淡入
 * 6. Dissolve Up  (2.8-3.4s)  整体向上溶解消散
 */

interface BootSequenceProps {
  originX?: number
  originY?: number
  onComplete?: () => void
  username?: string
}

const TOTAL_DURATION = 3400

export function BootSequence({
  // 保留接口兼容性：新版本为纯排版动画，不再需要粒子源点
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

    // 阶段 6：触发整体向上溶解
    const dissolveTimer = window.setTimeout(() => setDissolving(true), 2800)
    // 序列结束，回调并卸载
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
      style={{ overflow: "hidden" }}
    >
      {/* 深色遮幕 —— 兼任整体溶解容器 */}
      <div
        className={`absolute inset-0 ryden-overlay-in ${dissolving ? "ryden-dissolve-up" : ""}`}
        style={{ backgroundColor: "#0a0a14" }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {/* 琥珀细线 —— 从左向右画出 */}
          <div
            className="ryden-line-draw"
            style={{
              width: "60%",
              maxWidth: "640px",
              height: "1px",
              backgroundColor: "#c87941",
              marginBottom: "2.5rem",
              animationDelay: "0.3s",
            }}
          />

          {/* 主标题 —— 逐字遮罩揭示 + 字距由宽收紧 */}
          <h1
            className="font-display font-bold text-6xl md:text-8xl"
            style={{
              color: "#faf9f7",
              textShadow: "0 0 40px rgba(200, 121, 65, 0.35)",
              letterSpacing: "0.02em",
              animation:
                "rydenTitleTrack 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both",
            }}
          >
            {titleChars.map((char, i) => (
              <span
                key={i}
                className="ryden-letter-reveal"
                style={{ animationDelay: `${0.6 + i * 0.12}s` }}
              >
                {char}
              </span>
            ))}
          </h1>

          {/* 副标题 —— 大写英文，tracking-wide，muted amber */}
          <p
            className="ryden-fade-in mt-6 text-xs md:text-sm font-mono tracking-[0.4em] uppercase"
            style={{
              color: "rgba(232, 168, 124, 0.6)",
              animationDelay: "1.4s",
            }}
          >
            Memory Starmap
          </p>

          {/* 欢迎语 —— 较大字号 */}
          <p
            className="ryden-fade-in mt-8 text-2xl md:text-3xl font-display font-semibold"
            style={{
              color: "#e8a87c",
              textShadow: "0 0 24px rgba(232, 168, 124, 0.25)",
              animationDelay: "1.8s",
            }}
          >
            {username ? username : "欢迎回来"}
          </p>
        </div>
      </div>
    </div>
  )
}
