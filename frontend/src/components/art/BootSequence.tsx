import { useEffect, useRef, useState } from "react"

/**
 * 记忆星图启动序列 · v5 白底版
 * 纯 CSS 排版动效，参照 ryden.co.jp 日式排版风格。
 * 白底 + 黑字 + 琥珀细线点缀。
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
      {/* 白底遮幕 */}
      <div
        className={`absolute inset-0 ryden-overlay-in ${dissolving ? "ryden-dissolve-up" : ""}`}
        style={{
          background:
            "radial-gradient(ellipse at center, rgb(255, 255, 255) 0%, rgb(248, 250, 252) 60%, rgb(241, 245, 249) 100%)",
        }}
      >
        {/* 中心内容 */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{
            transform: dissolving ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* 琥珀线从中心展开 */}
          <div
            className="ryden-line-expand"
            style={{
              width: "min(70%, 720px)",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, #c87941 30%, #b45309 50%, #c87941 70%, transparent)",
              marginBottom: "3rem",
              animationDelay: "0.3s",
            }}
          />

          {/* 主标题 — 逐字遮罩揭示 */}
          <h1
            className="font-display text-6xl md:text-8xl lg:text-9xl"
            style={{
              fontWeight: 800,
              color: "#0a0a0a",
              letterSpacing: "0.02em",
              animation:
                "rydenTitleTrack 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both",
            }}
          >
            {titleChars.map((char, i) => (
              <span
                key={i}
                className="ryden-letter-reveal"
                style={{ animationDelay: `${0.6 + i * 0.14}s` }}
              >
                {char}
              </span>
            ))}
          </h1>

          {/* 装饰线 */}
          <div
            className="ryden-fade-in"
            style={{
              width: "40px",
              height: "2px",
              background: "#c87941",
              marginTop: "1.5rem",
              marginBottom: "1.5rem",
              animationDelay: "1.2s",
            }}
          />

          {/* 副标题 */}
          <p
            className="ryden-fade-in text-xs md:text-sm font-mono tracking-[0.5em] uppercase"
            style={{
              color: "#9ca3af",
              animationDelay: "1.4s",
            }}
          >
            Memory Starmap
          </p>

          {/* 欢迎语 */}
          <p
            className="ryden-fade-in mt-8 text-2xl md:text-3xl font-display"
            style={{
              fontWeight: 600,
              color: "#b45309",
              animationDelay: "1.8s",
            }}
          >
            {username ? username : "欢迎回来"}
          </p>

          {/* 底部微标 */}
          <p
            className="ryden-fade-in absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{
              color: "rgba(0, 0, 0, 0.15)",
              animationDelay: "2.2s",
            }}
          >
            MAPS · AI Review Engine v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
