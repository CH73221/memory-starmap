import { useState, useEffect } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Brain,
  Upload,
  Sparkles,
  CreditCard,
  Star,
  GitBranch,
  BarChart3,
  ArrowRight,
  ChevronDown,
} from "lucide-react"

export const STORAGE_KEY = "tutorial_completed_v2"

/* ===========================================================
   步骤主色调 — 每步一种电影感强调色
   =========================================================== */
interface StepAccent {
  name: string
  hex: string
  rgb: string
}

const ACCENTS: StepAccent[] = [
  { name: "indigo", hex: "#6366f1", rgb: "99, 102, 241" },
  { name: "cyan", hex: "#06b6d4", rgb: "6, 182, 212" },
  { name: "purple", hex: "#a855f7", rgb: "168, 85, 247" },
  { name: "amber", hex: "#f59e0b", rgb: "245, 158, 11" },
  { name: "teal", hex: "#14b8a6", rgb: "20, 184, 166" },
  { name: "rose", hex: "#f43f5e", rgb: "244, 63, 94" },
  { name: "blue", hex: "#3b82f6", rgb: "59, 130, 246" },
]

/* ===========================================================
   STEP DATA — 保持原有 7 步及其文本内容
   视觉演示替换为：产品截图背景 + 悬浮特性卡片
   =========================================================== */
interface TutorialStepData {
  title: string
  description: string
  icon: LucideIcon
  tips: string[]
  highlights: string[]
  bgImage: string
  accent: StepAccent
}

const steps: TutorialStepData[] = [
  {
    title: "欢迎来到记忆星图",
    description:
      "MAPS · 你的 AI 私人复习教练。基于艾宾浩斯遗忘曲线 + GPT-4o，让每一分钟复习都精准有效。",
    icon: Star,
    tips: [
      "AI 知识图谱 — 自动构建知识网络，可视化所有关联",
      "AI 闪卡生成 — 上传笔记后 1 键生成高质量复习卡片",
      "遗忘曲线排程 — 基于 Ebbinghaus 1885 + SM-2 算法",
      "AI 学习分析 — GPT-4o 个性化诊断与改进建议",
    ],
    highlights: ["AI 知识图谱", "GPT-4o 引擎", "艾宾浩斯曲线"],
    bgImage: "/assets/product-dashboard.jpg",
    accent: ACCENTS[0],
  },
  {
    title: "上传你的第一份笔记",
    description:
      "支持 PDF、Word、图片、纯文本。所有格式 AI 都能深度解析。手写笔记也能通过 OCR 识别。",
    icon: Upload,
    tips: [
      "PDF 教材 — 自动提取文字、公式、图表",
      "图片笔记 — OCR 识别手写内容（支持中文）",
      "纯文本 — 直接粘贴课堂笔记或聊天记录",
      "拖拽上传 — 一次可上传多个文件",
    ],
    highlights: ["PDF · Word · 图片", "OCR 手写识别", "拖拽批量上传"],
    bgImage: "/assets/product-upload.jpg",
    accent: ACCENTS[1],
  },
  {
    title: "AI 智能解析 · 6 步流水线",
    description:
      "GPT-4o 大模型深度解析：读取笔记 → 语义理解 → 提取知识点 → 构建关联 → 生成闪卡 → 智能排程。",
    icon: Sparkles,
    tips: [
      "AI 自动提取 5-20 个核心知识点",
      "建立知识点之间的前置 / 包含 / 对比关系",
      "为每个知识点生成 2-4 张高质量闪卡",
      "SM-2 算法智能安排复习时间表",
    ],
    highlights: ["6 步智能流水线", "5-20 知识点", "SM-2 智能排程"],
    bgImage: "/assets/product-flashcard.jpg",
    accent: ACCENTS[2],
  },
  {
    title: "开始你的第一次复习",
    description:
      "通过主动回忆强化记忆。游戏化体验：连击奖励、成就徽章、目标进度环，复习也可以很上瘾。",
    icon: CreditCard,
    tips: [
      "点击卡片翻转查看答案",
      "根据掌握程度评分：😰 困难 / 🤔 一般 / 😊 简单",
      "SM-2 算法根据评分智能调整下次复习时间",
      "连续答对积累 combo，挑战最高连击",
    ],
    highlights: ["主动回忆强化", "连击 Combo 奖励", "成就徽章系统"],
    bgImage: "/assets/product-graph.jpg",
    accent: ACCENTS[3],
  },
  {
    title: "可视化知识图谱",
    description:
      "所有知识点自动构建成星空式知识网络。按学习主题分组着色，可搜索、可过滤、可点击查看详情。",
    icon: GitBranch,
    tips: [
      "按资料自动分组着色，8 种渐变色区分主题",
      "搜索节点快速定位，薄弱/掌握 智能过滤",
      "鼠标悬浮显示 tooltip，点击打开详情",
      "呼吸光晕 + 连线流动光点，视觉震撼",
    ],
    highlights: ["星空式知识网络", "8 色分组着色", "智能搜索过滤"],
    bgImage: "/assets/product-stats.jpg",
    accent: ACCENTS[4],
  },
  {
    title: "数据驱动的学习统计",
    description:
      "GitHub 风格热力图、遗忘曲线对比、能力雷达图、AI 智能洞察。一切数据可视化，让进步看得见。",
    icon: BarChart3,
    tips: [
      "过去一年的每日复习热力图",
      "近 30 天复习趋势面积图",
      "多维能力雷达图对比各学科",
      "基于 5 篇经典认知科学论文的研究支撑",
    ],
    highlights: ["学习热力图", "遗忘曲线对比", "能力雷达图"],
    bgImage: "/assets/product-ai.jpg",
    accent: ACCENTS[5],
  },
  {
    title: "AI 学习助手 · 你的私人教练",
    description:
      "对话式 AI 助手。4 种分析模式：诊断、大纲、要点、薄弱。基于你的真实数据生成个性化建议。",
    icon: Brain,
    tips: [
      "4 种快速分析：诊断 / 大纲 / 要点 / 薄弱",
      "对话式交互，流式打字 + AI 思考动画",
      "数据驱动：基于你最近 7 天的实际学习",
      "OpenAI GPT-4o 驱动，准确理解学习意图",
    ],
    highlights: ["4 种分析模式", "流式打字交互", "数据驱动建议"],
    bgImage: "/assets/product-dashboard.jpg",
    accent: ACCENTS[6],
  },
]

/* ===========================================================
   CINEMATIC STEP VIEW — 单步全屏视图
   多层暗色 + 产品截图视差背景 + 3D 悬浮特性卡
   =========================================================== */
interface StepViewProps {
  step: TutorialStepData
  stepNumber: number
  totalSteps: number
}

function StepView({ step, stepNumber, totalSteps }: StepViewProps) {
  const padded = String(stepNumber).padStart(2, "0")
  const totalPadded = String(totalSteps).padStart(2, "0")
  const Icon = step.icon
  const { accent } = step

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ── 产品截图视差背景 ── */}
      <div
        className="parallax-bg pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${step.bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "right center",
          backgroundRepeat: "no-repeat",
          opacity: 0.15,
          mixBlendMode: "luminosity",
        }}
      />

      {/* ── 左侧渐隐遮罩，让背景图集中在右侧 ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgb(13,14,16) 0%, rgb(13,14,16) 32%, rgba(13,14,16,0.88) 52%, rgba(13,14,16,0.55) 100%)",
        }}
      />

      {/* ── 步骤主色调晕染 ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 85% 50%, rgba(${accent.rgb}, 0.14) 0%, transparent 60%)`,
        }}
      />

      {/* ── 巨大步骤编号水印（带主色辉光） ── */}
      <div className="pointer-events-none absolute top-0 left-0 p-6 lg:p-12 xl:p-16 z-0">
        <div className="cinematic-number-reveal flex items-baseline gap-3">
          <span
            className="font-display font-thin leading-none tracking-tighter select-none"
            style={{
              fontSize: "clamp(6rem, 13vw, 11rem)",
              color: "transparent",
              WebkitTextStroke: `1px rgba(${accent.rgb}, 0.38)`,
              filter: `drop-shadow(0 0 28px rgba(${accent.rgb}, 0.28))`,
            }}
          >
            {padded}
          </span>
          <span className="font-mono text-xs text-gray-500 tracking-[0.3em] hidden sm:inline">
            / {totalPadded}
          </span>
        </div>
      </div>

      {/* ── 内容栅格：左文 右特性卡 ── */}
      <div
        className="relative z-10 grid h-full grid-cols-1 lg:grid-cols-2 gap-8 px-6 sm:px-10 lg:px-16 xl:px-24 py-16 lg:py-20"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* 左侧：文字 */}
        <div className="flex max-w-xl flex-col justify-center">
          {/* 步骤标签 */}
          <div
            className="cinematic-fade-up mb-6 flex items-center gap-4"
            style={{ animationDelay: "120ms" }}
          >
            <span
              className="cinematic-line-grow h-px w-12"
              style={{ background: accent.hex, animationDelay: "120ms" }}
            />
            <Icon className="h-4 w-4" style={{ color: accent.hex }} />
            <span
              className="font-mono text-[11px] uppercase tracking-[0.35em]"
              style={{ color: `rgba(${accent.rgb}, 0.85)` }}
            >
              Step {padded} / {totalPadded}
            </span>
          </div>

          {/* 标题 — font-display weight 400，字距收紧 */}
          <h2
            className="font-display cinematic-fade-up mb-6 text-4xl font-normal tracking-[-0.02em] text-white sm:text-5xl xl:text-6xl"
            style={{ animationDelay: "220ms" }}
          >
            {step.title}
          </h2>

          {/* 描述 */}
          <p
            className="cinematic-fade-up mb-10 max-w-xl text-base leading-relaxed text-gray-400 lg:text-lg"
            style={{ animationDelay: "320ms" }}
          >
            {step.description}
          </p>

          {/* 要点 — 细线编号列表，编号使用主色 */}
          {step.tips.length > 0 && (
            <ul className="max-w-xl">
              {step.tips.map((tip, i) => (
                <li
                  key={i}
                  className="cinematic-fade-up flex items-start gap-5 border-t border-white/[0.06] py-4"
                  style={{ animationDelay: `${420 + i * 110}ms` }}
                >
                  <span
                    className="mt-0.5 w-6 shrink-0 font-mono text-[11px] tracking-[0.2em]"
                    style={{ color: `rgba(${accent.rgb}, 0.85)` }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed text-gray-300">
                    {tip}
                  </span>
                </li>
              ))}
              <li className="border-t border-white/[0.06]" aria-hidden="true" />
            </ul>
          )}
        </div>

        {/* 右侧：3D 悬浮特性卡 */}
        <div
          className="hidden lg:flex items-center justify-center"
          style={{ perspective: "1200px" }}
        >
          {/* 入场缩放容器 */}
          <div
            className="cinematic-zoom-in relative w-full max-w-sm"
            style={{ animationDelay: "440ms" }}
          >
            {/* 浮动容器 */}
            <div className="feature-card-float">
              {/* 卡片本体 */}
              <div
                className="relative rounded-2xl border p-8 backdrop-blur-xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(32,36,39,0.85), rgba(13,14,16,0.92))",
                  borderColor: `rgba(${accent.rgb}, 0.28)`,
                  boxShadow: `0 24px 60px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(${accent.rgb}, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}
              >
                {/* 顶部主色细线 */}
                <span
                  className="cinematic-line-grow absolute -top-px left-8 h-px w-16"
                  style={{ background: accent.hex, animationDelay: "600ms" }}
                />

                {/* 图标 */}
                <div
                  className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, rgba(${accent.rgb}, 0.28), rgba(${accent.rgb}, 0.1))`,
                    boxShadow: `0 0 30px rgba(${accent.rgb}, 0.4), inset 0 1px 0 rgba(255,255,255,0.12)`,
                    border: `1px solid rgba(${accent.rgb}, 0.32)`,
                  }}
                >
                  <Icon className="h-7 w-7" style={{ color: accent.hex }} />
                </div>

                {/* 特性标签 */}
                <p
                  className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: `rgba(${accent.rgb}, 0.75)` }}
                >
                  Feature Highlight
                </p>

                {/* 关键点列表 */}
                <ul className="space-y-4">
                  {step.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="cinematic-fade-up flex items-center gap-3"
                      style={{ animationDelay: `${560 + i * 100}ms` }}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px]"
                        style={{
                          background: `rgba(${accent.rgb}, 0.16)`,
                          color: accent.hex,
                          border: `1px solid rgba(${accent.rgb}, 0.32)`,
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium text-gray-200">
                        {h}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* 底部装饰 */}
                <div className="mt-7 flex items-center justify-between border-t border-white/[0.06] pt-5">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-gray-500">
                    MAPS · v2
                  </span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: accent.hex,
                      boxShadow: `0 0 12px ${accent.hex}`,
                    }}
                  />
                </div>
              </div>

              {/* 卡片外光晕 */}
              <div
                className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl"
                style={{
                  background: `radial-gradient(circle at 50% 50%, rgba(${accent.rgb}, 0.18), transparent 70%)`,
                  filter: "blur(22px)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===========================================================
   MAIN TUTORIAL COMPONENT — 电影感全屏引导
   多层暗色背景 + 视差 + 3D 透视 + 步骤主色
   =========================================================== */
interface TutorialProps {
  open: boolean
  onComplete: () => void
}

export function Tutorial({ open, onComplete }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  // 打开时锁定背景滚动并重置到首步
  useEffect(() => {
    if (open) {
      setCurrentStep(0)
      setDirection(1)
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [open])

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    onComplete()
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1)
      setCurrentStep((s) => s + 1)
    } else {
      complete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((s) => s - 1)
    }
  }

  // 键盘导航
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (currentStep < steps.length - 1) {
          setDirection(1)
          setCurrentStep((s) => s + 1)
        } else {
          complete()
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) {
          setDirection(-1)
          setCurrentStep((s) => s - 1)
        }
      } else if (e.key === "Escape") {
        complete()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStep])

  if (!open) return null

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100
  const accent = step.accent
  const slideClass =
    direction === 1 ? "cinematic-slide-in" : "cinematic-slide-in-reverse"

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="新手引导"
      style={{ background: "rgb(13, 14, 16)" }}
    >
      {/* ── 多层暗色背景：cipherdigital 调色板 ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(20,22,24,0.95), rgba(13,14,16,0.98))",
        }}
      />
      {/* 顶部主色柔光（随步骤变化） */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 transition-all duration-700"
        style={{
          background: `linear-gradient(180deg, rgba(${accent.rgb}, 0.07), transparent)`,
        }}
      />
      {/* 胶片颗粒噪点 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
        }}
      />

      {/* 顶部栏：品牌 + 跳过 */}
      <div className="relative z-20 flex shrink-0 items-center justify-between px-6 pt-6 sm:px-10 lg:px-16 lg:pt-8">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-gray-500">
          Memory · Starmap
        </span>
        <button
          onClick={complete}
          className="text-sm tracking-wide text-gray-500 transition-colors duration-200 hover:text-white"
        >
          跳过
        </button>
      </div>

      {/* 主内容区：全屏步骤视图，横向滑动 + 渐显过渡 */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
        <div key={currentStep} className={cn("absolute inset-0", slideClass)}>
          <StepView
            step={step}
            stepNumber={currentStep + 1}
            totalSteps={steps.length}
          />
        </div>
      </div>

      {/* 底部栏：进度 + 滚动指示 + 导航 */}
      <div className="relative z-20 shrink-0 px-6 pb-8 pt-6 sm:px-10 lg:px-16">
        {/* 进度细线 — 主色渐变 */}
        <div className="mb-5">
          <div className="relative h-px w-full overflow-hidden bg-white/[0.08]">
            <div
              className="absolute top-0 left-0 h-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, rgba(${accent.rgb}, 0.4), ${accent.hex})`,
                boxShadow: `0 0 12px rgba(${accent.rgb}, 0.6)`,
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-gray-500">
            <span>
              {String(currentStep + 1).padStart(2, "0")}{" "}
              <span className="text-gray-600">
                / {String(steps.length).padStart(2, "0")}
              </span>
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* 导航 + 滚动指示器 */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={cn(
              "text-sm tracking-wide transition-colors duration-200",
              currentStep === 0
                ? "cursor-not-allowed text-gray-700"
                : "text-gray-400 hover:text-white",
            )}
          >
            上一步
          </button>

          {/* 滚动指示器（脉冲） */}
          <div className="flex flex-1 justify-center">
            <div className="scroll-pulse flex flex-col items-center gap-0.5">
              <span className="font-mono text-[9px] tracking-[0.3em] text-gray-600">
                SCROLL
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
            </div>
          </div>

          <button
            onClick={handleNext}
            className="group flex items-center gap-3 px-8 py-3 text-sm font-medium tracking-wide text-white transition-all duration-300 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #c87941, #e8a87c)",
              boxShadow:
                "0 8px 24px -8px rgba(200, 121, 65, 0.5), 0 0 0 1px rgba(232, 168, 124, 0.2)",
            }}
          >
            {isLast ? "开始使用" : "继续"}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function isTutorialCompleted(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true"
}

export function resetTutorial() {
  localStorage.removeItem(STORAGE_KEY)
}
