/**
 * AISpinnerIcon — 缓慢旋转的 AI 神经结图标
 * 灵感来自 ChatGPT logo 的结绳造型，使用 SVG path + CSS 旋转
 * 纸墨色调，无发光，纯线条美学
 */

import { motion } from "motion/react"

interface Props {
  size?: number
  className?: string
}

export function AISpinnerIcon({ size = 80, className = "" }: Props) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 外层缓慢旋转的结绳图形 */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
      >
        {/* 六瓣花结 — 类似 ChatGPT 的拓扑结绳 */}
        <g stroke="var(--ink-700)" strokeWidth="2.5" strokeLinecap="round" fill="none">
          {/* 上 */}
          <path d="M 50 12 C 58 25, 58 35, 50 48 C 42 35, 42 25, 50 12 Z" />
          {/* 右上 */}
          <path d="M 82 30 C 70 35, 62 40, 56 50 C 68 48, 76 42, 82 30 Z" />
          {/* 右下 */}
          <path d="M 82 70 C 72 62, 64 58, 56 50 C 68 52, 76 58, 82 70 Z" />
          {/* 下 */}
          <path d="M 50 88 C 42 75, 42 65, 50 52 C 58 65, 58 75, 50 88 Z" />
          {/* 左下 */}
          <path d="M 18 70 C 28 62, 36 58, 44 50 C 32 52, 24 58, 18 70 Z" />
          {/* 左上 */}
          <path d="M 18 30 C 28 35, 36 40, 44 50 C 32 48, 24 42, 18 30 Z" />
        </g>
      </motion.svg>

      {/* 内层反向旋转的装饰圆环 */}
      <motion.svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 60 60"
        fill="none"
        className="absolute"
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="30" cy="30" r="22"
          stroke="var(--amber)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          fill="none"
          opacity="0.5"
        />
        <circle
          cx="30" cy="30" r="14"
          stroke="var(--ink-400)"
          strokeWidth="1"
          strokeDasharray="2 4"
          fill="none"
          opacity="0.4"
        />
      </motion.svg>

      {/* 中心点 */}
      <motion.div
        className="absolute rounded-full bg-ink-800"
        style={{ width: size * 0.08, height: size * 0.08 }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
