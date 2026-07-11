import { useEffect, useRef, useState } from "react"

/**
 * 记忆星图启动序列 · Memory Starmap Boot Sequence v4
 *
 * 品牌 LOGO 动画，参照 ryden.co.jp 日式创意 agency 排版风格。
 * 纯 CSS/SVG 排版驱动，无 canvas / 粒子 / 星轨。
 *
 * 配色采用多层深炭灰（非纯黑），琥珀 + 深青双色点缀。
 *
 * 7 个阶段（总计约 3.6s）：
 * 1. Overlay In   (0.0-0.4s)  多层深色遮幕淡入 + 微光晕
 * 2. Line Draw    (0.3-0.9s)  琥珀细线从中心向两侧展开
 * 3. Title Reveal (0.6-1.8s)  "记忆星图" 逐字遮罩揭示 + 字距由宽收紧
 * 4. Subtitle     (1.4-2.0s)  "MEMORY STARMAP" 副标题淡入
 * 5. Welcome      (1.8-2.5s)  欢迎语淡入 + 描边动画
 * 6. Hold         (2.5-2.9s)  短暂停留，内容微缩
 * 7. Dissolve     (2.9-3.6s)  整体向上溶解 + 缩放消散
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
      {/* 深色遮幕 —— 多层深炭灰，非纯黑 */}
      <div
        className={`absolute inset-0 ryden-overlay-in ${dissolving ? "ryden-dissolve-up" : ""}`}
        style={{
          background:
            "radial-gradient(ellipse at center, rgb(32, 36, 39) 0%, rgb(20, 22, 24) 50%, rgb(13, 14, 16) 100%)",
        }}
      >
        {/* 微光晕层 —— 琥珀 + 深青双色 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(200, 121, 65, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)",
          }}
        />

        {/* 胶片颗粒噪点 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
          }}
        />

        {/* 中心内容容器 */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{
            transform: dissolving ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* 琥珀线 —— 从中心向两侧展开 */}
          <div
            className="ryden-line-expand"
            style={{
              width: "min(70%, 720px)",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, #c87941 30%, #e8a87c 50%, #c87941 70%, transparent)",
              marginBottom: "3rem",
              animationDelay: "0.3s",
            }}
          />

          {/* 主标题 —— 逐字遮罩揭示 + 字距由宽收紧 */}
          <h1
            className="font-display text-6xl md:text-8xl lg:text-9xl"
            style={{
              fontWeight: 700,
              color: "#faf9f7",
              textShadow:
                "0 0 60px rgba(200, 121, 65, 0.3), 0 0 120px rgba(6, 182, 212, 0.08)",
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

          {/* 装饰线 —— 标题下方 */}
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

          {/* 副标题 —— 大写英文，tracking-wide */}
          <p
            className="ryden-fade-in text-xs md:text-sm font-mono tracking-[0.5em] uppercase"
            style={{
              color: "rgba(232, 168, 124, 0.7)",
              animationDelay: "1.4s",
            }}
          >
            Memory Starmap
          </p>

          {/* 欢迎语 —— 较大字号，描边渐显 */}
          <p
            className="ryden-fade-in mt-8 text-2xl md:text-3xl font-display"
            style={{
              fontWeight: 600,
              color: "#e8a87c",
              textShadow: "0 0 30px rgba(232, 168, 124, 0.2)",
              animationDelay: "1.8s",
            }}
          >
            {username ? username : "欢迎回来"}
          </p>

          {/* 底部微标 —— 版本号 */}
          <p
            className="ryden-fade-in absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{
              color: "rgba(255, 255, 255, 0.15)",
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
