import { cn } from "@/lib/utils"
import { motion } from "motion/react"

interface ReviewControlsProps {
  onReview: (quality: number) => void
  disabled: boolean
}

// 低饱和度色：红→橙→黄→绿→青→蓝
const qualityButtons = [
  { quality: 0, label: "完全忘了", keyHint: "1", color: "#b85450" },  // 暗红
  { quality: 1, label: "想不起来", keyHint: "2", color: "#c87941" },  // 琥珀
  { quality: 2, label: "有点难",   keyHint: "3", color: "#c9a227" },  // 暗黄
  { quality: 3, label: "还可以",   keyHint: "4", color: "#5b8c5a" },  // 墨绿
  { quality: 4, label: "很顺利",   keyHint: "5", color: "#4f9a9a" },  // 青
  { quality: 5, label: "太简单了", keyHint: "6", color: "#1a1a2e" },  // 墨蓝
]

export default function ReviewControls({ onReview, disabled }: ReviewControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-8"
    >
      <p className="text-center text-xs text-ink-400 mb-4 font-sans tracking-wide">
        你觉得这个知识点掌握得如何？
      </p>
      <motion.div
        className="grid grid-cols-3 sm:grid-cols-6 gap-2"
        initial="initial"
        animate="animate"
        variants={{
          initial: {},
          animate: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
        }}
      >
        {qualityButtons.map((b) => (
          <motion.button
            key={b.quality}
            onClick={() => onReview(b.quality)}
            disabled={disabled}
            variants={{
              initial: { opacity: 0, y: 10, filter: "blur(4px)" },
              animate: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
              },
            }}
            whileHover={{
              y: -3,
              transition: { type: "spring", stiffness: 400, damping: 20 },
            }}
            whileTap={{ scale: 0.92, y: 0 }}
            className={cn(
              "group relative py-3 px-2 rounded-xl flex flex-col items-center gap-1",
              "border transition-colors duration-200",
              "bg-white",
              "shimmer-overlay",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
            style={{
              borderColor: "var(--border-light)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = b.color
              e.currentTarget.style.backgroundColor = `${b.color}08`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-light)"
              e.currentTarget.style.backgroundColor = "white"
            }}
          >
            {/* 底部色条 — 悬停时扩展为完整底色 */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl"
              style={{ backgroundColor: b.color }}
              initial={{ opacity: 0.5, height: 2 }}
              whileHover={{ opacity: 1, height: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />

            {/* 文字标签 */}
            <span
              className="text-[11px] font-medium font-sans"
              style={{ color: b.color }}
            >
              {b.label}
            </span>

            {/* 键盘提示 */}
            <span className="text-[9px] text-ink-400 font-mono">
              {b.keyHint}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  )
}
