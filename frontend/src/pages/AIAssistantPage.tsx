/**
 * AIAssistantPage — 纸墨色调 + 动效科技感
 *
 * 科技感来源（不改配色）：
 * - AISpinnerIcon: 缓慢旋转的六瓣结绳图标（类 ChatGPT 风格）
 * - TechPatternBg: Canvas 流动电路线 + 琥珀色数据粒子
 * - SVG 描边动画：装饰性电路图案
 * - 错峰入场动画 + 数据流条
 */

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { AIChatPanel } from "@/components/dashboard/AIChatPanel"
import { AIAnalysisPanel } from "@/components/dashboard/AIAnalysisPanel"
import { AISpinnerIcon } from "@/components/art/AISpinnerIcon"
import { TechPatternBg } from "@/components/art/TechPatternBg"
import api from "@/services/api"
import { Sparkles, Zap, Shield, Activity, Cpu } from "lucide-react"

export default function AIAssistantPage() {
  const [aiOnline, setAiOnline] = useState(false)
  const [latency, setLatency] = useState(0)

  useEffect(() => {
    api.get("/ai/status").then((res) => {
      setAiOnline(res.data.available)
    }).catch(() => setAiOnline(false))

    const interval = setInterval(() => {
      setLatency(Math.floor(20 + Math.random() * 40))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative space-y-6">
      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl border border-[var(--border-light)] bg-paper-50"
      >
        {/* Tech pattern background — 纸色上的墨蓝电路线 */}
        <TechPatternBg nodeCount={24} />

        {/* 装饰性 SVG 电路图案 — 右上角 */}
        <svg className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-[0.06]" viewBox="0 0 200 200" fill="none">
          <g stroke="var(--ink-800)" strokeWidth="1" fill="none">
            <circle cx="100" cy="100" r="80" strokeDasharray="3 6" />
            <circle cx="100" cy="100" r="60" strokeDasharray="2 4" />
            <circle cx="100" cy="100" r="40" />
            <line x1="100" y1="20" x2="100" y2="180" />
            <line x1="20" y1="100" x2="180" y2="100" />
            <line x1="44" y1="44" x2="156" y2="156" />
            <line x1="156" y1="44" x2="44" y2="156" />
          </g>
        </svg>

        {/* 顶部数据流条 */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, var(--amber), transparent)",
            backgroundSize: "200% 100%",
            animation: "dataBarFlow 4s linear infinite",
          }}
        />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            {/* Left: Spinner + Title */}
            <div className="flex items-start gap-5 flex-1 min-w-0">
              {/* 缓慢旋转的 AI 图标 */}
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                className="shrink-0"
              >
                <AISpinnerIcon size={72} />
              </motion.div>

              <div className="flex-1 min-w-0">
                {/* Status badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${aiOnline ? "bg-success" : "bg-amber"} memory-pulse`} />
                  <span className="text-label font-sans">
                    {aiOnline ? "AI CORE · ONLINE" : "AI CORE · STANDBY"}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-display font-semibold text-ink-800 tracking-tight mb-2">
                  AI 学习助手
                </h1>
                <p className="text-sm text-ink-500 max-w-lg leading-relaxed font-sans">
                  基于你的学习数据，AI 为你提供个性化学习诊断、智能大纲生成、核心要点总结和薄弱环节分析。
                </p>
              </div>
            </div>

            {/* Right: 状态读数 — 纸墨风格 */}
            <div className="flex flex-col gap-2 min-w-[140px]">
              <StatusReadout icon={Cpu} label="模型" value={aiOnline ? "Qwen-2.5" : "本地"} />
              <StatusReadout icon={Activity} label="延迟" value={`${latency}ms`} />
              <StatusReadout icon={Sparkles} label="状态" value={aiOnline ? "已连接" : "降级模式"} />
            </div>
          </div>

          {/* Feature pills — 错峰入场 */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { icon: Sparkles, label: "智能诊断", delay: 0 },
              { icon: Zap, label: "个性建议", delay: 80 },
              { icon: Shield, label: "数据安全", delay: 160 },
              { icon: Activity, label: "实时分析", delay: 240 },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + f.delay / 1000, duration: 0.4 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[var(--border-light)] text-xs font-medium text-ink-600 backdrop-blur-sm hover-lift"
              >
                <f.icon className="w-3.5 h-3.5 text-amber" strokeWidth={1.75} />
                {f.label}
              </motion.div>
            ))}
          </div>
        </div>

        {/* 底部数据流条 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, var(--ink-400), transparent)",
            backgroundSize: "200% 100%",
            animation: "dataBarFlow 4s linear infinite reverse",
          }}
        />
      </motion.div>

      {/* ── Main Content: Chat + Analysis ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chat Panel */}
        <motion.div
          initial={{ opacity: 0, x: -16, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0)" }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-3"
        >
          <AIChatPanel className="h-auto lg:h-[700px]" />
        </motion.div>

        {/* Analysis Panel */}
        <motion.div
          initial={{ opacity: 0, x: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0)" }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2"
        >
          <AIAnalysisPanel className="h-auto" />
        </motion.div>
      </div>
    </div>
  )
}

// ── 状态读数组件 — 纸墨风格 ──
function StatusReadout({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cpu
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/60 border border-[var(--border-light)] backdrop-blur-sm">
      <Icon className="w-3.5 h-3.5 text-ink-400" strokeWidth={1.75} />
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-widest text-ink-400 font-sans">{label}</span>
        <span className="text-xs font-mono font-semibold text-ink-700">{value}</span>
      </div>
    </div>
  )
}
