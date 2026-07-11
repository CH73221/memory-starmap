import { useState, useEffect, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  Brain, Upload, Sparkles, CreditCard, Star, Zap, Target, BarChart3, GitBranch,
  CheckCircle2, ArrowRight, Trophy, Flame, Gamepad2, Lightbulb, Heart,
  FileText, Image as ImageIcon, FileSearch,
} from "lucide-react"

const STORAGE_KEY = "tutorial_completed_v2"

/* ===========================================================
   STEP 1 — WELCOME / HERO
   =========================================================== */
function WelcomeDemo() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Brand mark + intro */}
      <div className="relative flex flex-col items-center">
        {/* Animated logo */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-200/60 ai-glow">
            <Star className="w-10 h-10 text-white fill-white animate-spin-slow" />
          </div>
          {/* Orbital dots */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute -top-2 left-1/2 w-2 h-2 rounded-full bg-indigo-400 -translate-x-1/2" />
            <div className="absolute top-1/2 -right-2 w-1.5 h-1.5 rounded-full bg-pink-400 -translate-y-1/2" />
            <div className="absolute -bottom-2 left-1/2 w-2 h-2 rounded-full bg-purple-400 -translate-x-1/2" />
            <div className="absolute top-1/2 -left-2 w-1.5 h-1.5 rounded-full bg-amber-400 -translate-y-1/2" />
          </div>
        </div>

        <div className="text-center mb-3">
          <h3 className="text-xl font-extrabold gradient-text mb-1">MAPS · 你的 AI 复习教练</h3>
          <p className="text-[11px] text-gray-400">Memory AI Practice System</p>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-2 mb-3">
          <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600">艾宾浩斯曲线</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 flex items-center gap-1">
            <Brain className="w-3 h-3 text-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-600">GPT-4o AI</span>
          </div>
        </div>
      </div>

      {/* 4 core features grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { icon: GitBranch, color: "from-indigo-500 to-purple-500", label: "AI 知识图谱", desc: "可视化网络" },
          { icon: CreditCard, color: "from-purple-500 to-pink-500", label: "AI 闪卡生成", desc: "一键生成" },
          { icon: Sparkles, color: "from-pink-500 to-rose-500", label: "AI 学习分析", desc: "智能诊断" },
          { icon: Flame, color: "from-amber-500 to-orange-500", label: "遗忘曲线排程", desc: "精准时机" },
        ].map((item, i) => (
          <div
            key={i}
            className={cn(
              "p-3.5 rounded-2xl bg-gradient-to-br text-white shadow-lg animate-fade-in hover:scale-105 transition-all duration-300 relative overflow-hidden group",
              item.color
            )}
            style={{ animationDelay: `${300 + i * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
            <item.icon className="w-6 h-6 mb-1.5 relative z-10 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold relative z-10">{item.label}</p>
            <p className="text-[10px] opacity-75 relative z-10">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Value badges */}
      <div className="flex justify-center gap-1.5 pt-1">
        {[
          { icon: Zap, label: "2× 高效" },
          { icon: Heart, label: "免费核心" },
          { icon: Shield, label: "" },
        ].filter(b => b.icon).length > 0 && (
          <>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
              <Zap className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-600">SM-2 算法 · 2× 高效</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100">
              <Heart className="w-3 h-3 text-rose-500" />
              <span className="text-[9px] font-bold text-rose-600">核心免费</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Shield({ className }: { className?: string }) {
  return <span className={className}>🛡️</span>
}

/* ===========================================================
   STEP 2 — UPLOAD NOTES
   =========================================================== */
function UploadDemo() {
  const [hovering, setHovering] = useState(true)
  useEffect(() => {
    const t1 = setTimeout(() => setHovering(false), 1800)
    const t2 = setTimeout(() => setHovering(true), 2200)
    const i = setInterval(() => {
      setHovering(false); setTimeout(() => setHovering(true), 800)
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(i) }
  }, [])

  return (
    <div className="max-w-sm mx-auto">
      {/* Drop zone */}
      <div className={cn(
        "relative p-6 rounded-2xl border-2 border-dashed transition-all duration-300",
        hovering ? "border-indigo-400 bg-indigo-50/60 scale-[1.02]" : "border-gray-200 bg-gray-50"
      )}>
        {hovering && (
          <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-bold animate-bounce">
            松开即可上传
          </div>
        )}

        <Upload className={cn("w-10 h-10 mx-auto mb-3 transition-all duration-300", hovering ? "text-indigo-500 -translate-y-1" : "text-gray-400")} />
        <p className="text-sm font-bold text-gray-700 text-center">拖拽文件到此处</p>
        <p className="text-[10px] text-gray-400 text-center mt-0.5">或点击选择文件</p>

        {/* Format icons row */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {[
            { icon: FileText, label: "PDF", color: "text-red-500" },
            { icon: ImageIcon, label: "图片", color: "text-blue-500" },
            { icon: FileText, label: "TXT", color: "text-gray-400" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-100 shadow-sm">
              <f.icon className={cn("w-3 h-3", f.color)} />
              <span className="text-[10px] font-medium text-gray-400">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mock files being processed */}
      <div className="mt-3 space-y-1.5">
        {[
          { name: "线性代数笔记.pdf", size: "2.3 MB", icon: FileText, color: "bg-red-50 text-red-500", ext: "PDF", progress: 100 },
          { name: "概率论速查.jpg", size: "1.1 MB", icon: ImageIcon, color: "bg-blue-50 text-blue-600", ext: "IMG", progress: 100 },
        ].map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white shadow-sm border border-gray-100 animate-slide-up"
            style={{ animationDelay: `${500 + i * 200}ms` }}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0", f.color)}>{f.ext}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{f.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-gray-400">{f.size}</span>
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 confidence-fill" style={{ width: `${f.progress}%` }} />
                </div>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ===========================================================
   STEP 3 — AI PROCESSING PIPELINE (FOUR STAGES)
   =========================================================== */
function AIProcessingDemo() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 400),
      setTimeout(() => setStage(2), 1200),
      setTimeout(() => setStage(3), 2200),
      setTimeout(() => setStage(4), 3400),
      setTimeout(() => setStage(5), 4600),
    ]
    const i = setInterval(() => {
      setStage(s => (s + 1) % 6)
    }, 6000)
    return () => { timers.forEach(clearTimeout); clearInterval(i) }
  }, [])

  const steps = [
    { icon: FileSearch, label: "读取笔记", desc: "识别文本与公式", color: "from-indigo-500 to-blue-500" },
    { icon: Brain, label: "AI 语义理解", desc: "GPT-4o 深度分析", color: "from-blue-500 to-purple-500" },
    { icon: Target, label: "提取知识点", desc: "核心概念 12 个", color: "from-purple-500 to-pink-500" },
    { icon: GitBranch, label: "构建关联", desc: "建立 8 条关联", color: "from-pink-500 to-rose-500" },
    { icon: CreditCard, label: "生成闪卡", desc: "24 张复习卡", color: "from-rose-500 to-amber-500" },
    { icon: CheckCircle2, label: "排程复习", desc: "SM-2 智能排程", color: "from-emerald-500 to-teal-500" },
  ]

  return (
    <div className="max-w-md mx-auto space-y-3">
      {/* AI Header */}
      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100/60">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md ai-glow">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
            AI 智能解析引擎
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold">GPT-4o</span>
          </p>
          <p className="text-[10px] text-gray-400">基于深度学习的语义理解</p>
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 via-pink-200 to-emerald-200" />

        <div className="space-y-1.5">
          {steps.map((step, i) => {
            const Icon = step.icon
            const isDone = stage > i
            const isCurrent = stage === i + 1
            const isPending = stage <= i

            return (
              <div
                key={i}
                className={cn(
                  "relative flex items-center gap-3 p-2.5 rounded-xl transition-all duration-500",
                  isDone ? "bg-white shadow-sm border border-emerald-100" : isCurrent ? "bg-white shadow-md border border-indigo-100" : "bg-gray-50 opacity-50"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500",
                  isDone ? `bg-gradient-to-br ${step.color} text-white shadow-md` : isCurrent ? `bg-gradient-to-br ${step.color} text-white shadow-md animate-pulse` : "bg-gray-100 text-gray-400"
                )}>
                  {isDone ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Icon className="w-4.5 h-4.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold", isDone || isCurrent ? "text-gray-900" : "text-gray-400")}>{step.label}</p>
                  <p className={cn("text-[10px]", isDone || isCurrent ? "text-gray-400" : "text-gray-500")}>{step.desc}</p>
                </div>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {isCurrent && (
                  <div className="flex gap-0.5">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Completion banner */}
      {stage >= 6 && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/60 flex items-center gap-2.5 animate-slide-up">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-emerald-600">解析完成 🎉</p>
            <p className="text-[10px] text-emerald-600">AI 已为你构建完整学习方案</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ===========================================================
   STEP 4 — REVIEW WITH SM-2 + GAMIFICATION
   =========================================================== */
function ReviewDemo() {
  const [flipped, setFlipped] = useState(false)
  const [combo, setCombo] = useState(3)
  const [progress, setProgress] = useState(60)

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 1500)
    const t2 = setTimeout(() => setFlipped(false), 4500)
    const i = setInterval(() => {
      setCombo(c => (c >= 9 ? 2 : c + 1))
      setProgress(p => (p >= 90 ? 30 : p + 15))
    }, 3500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(i) }
  }, [])

  return (
    <div className="max-w-xs mx-auto">
      {/* Top: progress + combo */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {combo >= 3 && (
          <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-extrabold shadow-md animate-bounce-in">
            {combo}× 🔥
          </div>
        )}
      </div>

      {/* Card */}
      <div className={cn("flashcard-container cursor-pointer", flipped && "flipped")}>
        <div className="flashcard-inner relative h-44">
          <div className="flashcard-front absolute inset-0">
            <div className="h-full p-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-purple-200/50 flex flex-col items-center justify-center text-white ai-glow">
              <Brain className="w-6 h-6 mb-2 opacity-90 animate-pulse" />
              <p className="text-xs font-semibold text-center leading-relaxed">艾宾浩斯遗忘曲线的衰减率？</p>
              <p className="text-[9px] mt-2 opacity-60">点击翻转查看答案</p>
            </div>
          </div>
          <div className="flashcard-back absolute inset-0">
            <div className="h-full p-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-2xl shadow-emerald-200/50 flex flex-col items-center justify-center text-white">
              <CheckCircle2 className="w-6 h-6 mb-2 opacity-90" />
              <p className="text-xs text-center leading-relaxed px-2">呈指数衰减，20 分钟后保留 58%</p>
              <div className="flex gap-1.5 mt-2">
                {[
                  { l: "困难", c: "bg-white/20" },
                  { l: "一般", c: "bg-white/30" },
                  { l: "简单", c: "bg-white/40" },
                ].map((b, i) => (
                  <div key={i} className={cn("px-2 py-0.5 rounded text-[9px] font-bold", b.c)}>{b.l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SM-2 hint */}
      <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 animate-fade-in" style={{ animationDelay: "2.5s" }}>
        <Brain className="w-4 h-4 text-indigo-500 shrink-0" />
        <p className="text-[10px] text-indigo-600 font-medium">
          SM-2 算法根据你的评分智能调整下次复习时间，困难的卡片会更频繁出现
        </p>
      </div>

      {/* Gamification features */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="p-2 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-1.5 animate-fade-in" style={{ animationDelay: "3s" }}>
          <Gamepad2 className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-[10px] font-bold text-orange-700">连击奖励</span>
        </div>
        <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 flex items-center gap-1.5 animate-fade-in" style={{ animationDelay: "3.2s" }}>
          <Trophy className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-[10px] font-bold text-purple-600">成就徽章</span>
        </div>
      </div>
    </div>
  )
}

/* ===========================================================
   STEP 5 — KNOWLEDGE GRAPH (3D STAR MAP)
   =========================================================== */
function GraphDemo() {
  return (
    <div className="max-w-sm mx-auto">
      {/* Mock mini graph */}
      <div className="relative rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-3 overflow-hidden">
        {/* Stars background */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-indigo-300/40 animate-pulse"
              style={{
                width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 3 + 1}px`,
                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Mock graph nodes */}
        <div className="relative h-48">
          {/* Lines */}
          <svg className="absolute inset-0 w-full h-full">
            <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />
            <line x1="50%" y1="50%" x2="80%" y2="35%" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />
            <line x1="50%" y1="50%" x2="35%" y2="75%" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />
            <line x1="50%" y1="50%" x2="70%" y2="78%" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />
            <line x1="35%" y1="75%" x2="70%" y2="78%" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />
          </svg>

          {/* Center node */}
          <div className="absolute" style={{ left: "calc(50% - 18px)", top: "calc(50% - 18px)" }}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg flex items-center justify-center animate-pulse-glow">
              <Brain className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Other nodes */}
          {[
            { x: "20%", y: "30%", c: "#10b981", label: "特征值" },
            { x: "80%", y: "35%", c: "#f59e0b", label: "行列式" },
            { x: "35%", y: "75%", c: "#ef4444", label: "向量空间" },
            { x: "70%", y: "78%", c: "#8b5cf6", label: "矩阵运算" },
          ].map((n, i) => (
            <div
              key={i}
              className="absolute animate-bounce-in"
              style={{ left: `calc(${n.x} - 12px)`, top: `calc(${n.y} - 12px)`, animationDelay: `${300 + i * 150}ms` }}
            >
              <div className="w-6 h-6 rounded-full shadow-md flex items-center justify-center" style={{ background: n.c }}>
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div className="relative mt-2 flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-100 shadow-sm animate-slide-up" style={{ animationDelay: "1s" }}>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-900">矩阵运算</p>
            <p className="text-[9px] text-gray-400">点击节点查看详情</p>
          </div>
          <div className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold">65%</div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        {[
          { icon: GitBranch, label: "分组着色" },
          { icon: Sparkles, label: "智能过滤" },
          { icon: BarChart3, label: "掌握度可视化" },
        ].map((f, i) => (
          <div key={i} className="p-2 rounded-lg bg-white border border-gray-100 flex flex-col items-center gap-1 animate-fade-in" style={{ animationDelay: `${1.2 + i * 0.1}s` }}>
            <f.icon className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[9px] font-medium text-gray-400">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ===========================================================
   STEP 6 — STATS + DASHBOARD (WITH HEATMAP)
   =========================================================== */
function StatsDemo() {
  return (
    <div className="max-w-sm mx-auto space-y-3">
      {/* Mini stats cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: "42", l: "知识点", c: "text-indigo-600", bg: "from-indigo-50 to-indigo-100" },
          { v: "28", l: "已掌握", c: "text-emerald-600", bg: "from-emerald-50 to-emerald-100" },
          { v: "5", l: "连续天", c: "text-orange-600", bg: "from-orange-50 to-orange-100" },
        ].map((s, i) => (
          <div key={i} className={cn("p-2.5 rounded-xl bg-gradient-to-br animate-fade-in", s.bg)} style={{ animationDelay: `${i * 100}ms` }}>
            <p className={cn("text-xl font-extrabold", s.c)}>{s.v}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Mini heatmap */}
      <div className="p-3 rounded-2xl bg-white border border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <p className="text-xs font-bold text-gray-900">学习热力图</p>
        </div>
        <div className="flex gap-0.5">
          {[...Array(35)].map((_, i) => {
            const level = Math.floor(Math.random() * 5)
            const colors = ["bg-gray-100", "bg-emerald-50", "bg-emerald-300", "bg-emerald-500", "bg-emerald-700"]
            return (
              <div
                key={i}
                className={cn("w-2 h-2 rounded-sm animate-fade-in", colors[level])}
                style={{ animationDelay: `${300 + i * 20}ms` }}
              />
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[9px] text-gray-400">少</p>
          <p className="text-[9px] text-gray-400">多</p>
        </div>
      </div>

      {/* AI Insight callout */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100/60 flex items-start gap-2.5 animate-fade-in" style={{ animationDelay: "1.5s" }}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-gray-900">💡 AI 智能洞察</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
            基于 Ebbinghaus 1885 研究，第 7 天复习可保留 <span className="font-bold text-indigo-600">87%</span> 记忆
          </p>
        </div>
      </div>
    </div>
  )
}

/* ===========================================================
   STEP 7 — AI ASSISTANT (CHAT)
   =========================================================== */
function AIAssistantDemo() {
  const [typing, setTyping] = useState(false)
  const [showReply, setShowReply] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setTyping(true), 800)
    const t2 = setTimeout(() => { setTyping(false); setShowReply(true) }, 3000)
    const i = setInterval(() => {
      setShowReply(false); setTyping(false)
      setTimeout(() => setTyping(true), 600)
      setTimeout(() => { setTyping(false); setShowReply(true) }, 2800)
    }, 5500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(i) }
  }, [])

  return (
    <div className="max-w-sm mx-auto space-y-3">
      {/* Quick action chips */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {[
          { icon: Target, label: "学习诊断", c: "from-indigo-500 to-purple-500" },
          { icon: BookOpen, label: "学习大纲", c: "from-blue-500 to-cyan-500" },
          { icon: Star, label: "核心要点", c: "from-amber-500 to-orange-500" },
          { icon: Lightbulb, label: "薄弱分析", c: "from-rose-500 to-pink-500" },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-gray-200 shadow-sm animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className={cn("w-4 h-4 rounded-full bg-gradient-to-br flex items-center justify-center", a.c)}>
              <a.icon className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-[10px] font-medium text-gray-500">{a.label}</span>
          </div>
        ))}
      </div>

      {/* User message */}
      <div className="flex items-start gap-2 justify-end animate-fade-in">
        <div className="max-w-[75%] px-3 py-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs shadow-md shadow-indigo-100 rounded-tr-md">
          请分析我最近的学习情况
        </div>
      </div>

      {/* AI thinking */}
      {typing && (
        <div className="flex items-start gap-2 animate-fade-in">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 ai-glow">
            <Brain className="w-3 h-3 text-white" />
          </div>
          <div className="bg-gray-100 rounded-2xl rounded-tl-md px-3 py-2">
            <div className="flex items-center gap-1">
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </div>
          </div>
        </div>
      )}

      {/* AI reply */}
      {showReply && (
        <div className="flex items-start gap-2 animate-fade-in">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
            <Brain className="w-3 h-3 text-white" />
          </div>
          <div className="max-w-[85%] px-3 py-2 rounded-2xl bg-gray-100 text-gray-700 text-[11px] rounded-tl-md leading-relaxed">
            <p>你的掌握率已达 <span className="font-bold text-emerald-600">66%</span>，建议优先攻克 <span className="font-bold text-red-500">「特征值」</span> 相关卡片</p>
            <div className="flex gap-1 mt-1.5">
              <div className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 text-[9px] font-bold">1 张薄弱</div>
              <div className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold">28 已掌握</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookOpen({ className }: { className?: string }) {
  return <span className={className}>📖</span>
}

/* ===========================================================
   STEP DATA — 保持原有 7 步及其文本内容
   =========================================================== */
interface TutorialStepData {
  title: string
  description: string
  icon: ReactNode
  tips: string[]
  visual: ReactNode
}

const steps: TutorialStepData[] = [
  {
    title: "欢迎来到记忆星图",
    description: "MAPS · 你的 AI 私人复习教练。基于艾宾浩斯遗忘曲线 + GPT-4o，让每一分钟复习都精准有效。",
    icon: <Star className="w-8 h-8" />,
    tips: [
      "AI 知识图谱 — 自动构建知识网络，可视化所有关联",
      "AI 闪卡生成 — 上传笔记后 1 键生成高质量复习卡片",
      "遗忘曲线排程 — 基于 Ebbinghaus 1885 + SM-2 算法",
      "AI 学习分析 — GPT-4o 个性化诊断与改进建议",
    ],
    visual: <WelcomeDemo />,
  },
  {
    title: "上传你的第一份笔记",
    description: "支持 PDF、Word、图片、纯文本。所有格式 AI 都能深度解析。手写笔记也能通过 OCR 识别。",
    icon: <Upload className="w-8 h-8" />,
    tips: [
      "PDF 教材 — 自动提取文字、公式、图表",
      "图片笔记 — OCR 识别手写内容（支持中文）",
      "纯文本 — 直接粘贴课堂笔记或聊天记录",
      "拖拽上传 — 一次可上传多个文件",
    ],
    visual: <UploadDemo />,
  },
  {
    title: "AI 智能解析 · 6 步流水线",
    description: "GPT-4o 大模型深度解析：读取笔记 → 语义理解 → 提取知识点 → 构建关联 → 生成闪卡 → 智能排程。",
    icon: <Sparkles className="w-8 h-8" />,
    tips: [
      "AI 自动提取 5-20 个核心知识点",
      "建立知识点之间的前置 / 包含 / 对比关系",
      "为每个知识点生成 2-4 张高质量闪卡",
      "SM-2 算法智能安排复习时间表",
    ],
    visual: <AIProcessingDemo />,
  },
  {
    title: "开始你的第一次复习",
    description: "通过主动回忆强化记忆。游戏化体验：连击奖励、成就徽章、目标进度环，复习也可以很上瘾。",
    icon: <CreditCard className="w-8 h-8" />,
    tips: [
      "点击卡片翻转查看答案",
      "根据掌握程度评分：😰 困难 / 🤔 一般 / 😊 简单",
      "SM-2 算法根据评分智能调整下次复习时间",
      "连续答对积累 combo，挑战最高连击",
    ],
    visual: <ReviewDemo />,
  },
  {
    title: "可视化知识图谱",
    description: "所有知识点自动构建成星空式知识网络。按学习主题分组着色，可搜索、可过滤、可点击查看详情。",
    icon: <GitBranch className="w-8 h-8" />,
    tips: [
      "按资料自动分组着色，8 种渐变色区分主题",
      "搜索节点快速定位，薄弱/掌握 智能过滤",
      "鼠标悬浮显示 tooltip，点击打开详情",
      "呼吸光晕 + 连线流动光点，视觉震撼",
    ],
    visual: <GraphDemo />,
  },
  {
    title: "数据驱动的学习统计",
    description: "GitHub 风格热力图、遗忘曲线对比、能力雷达图、AI 智能洞察。一切数据可视化，让进步看得见。",
    icon: <BarChart3 className="w-8 h-8" />,
    tips: [
      "过去一年的每日复习热力图",
      "近 30 天复习趋势面积图",
      "多维能力雷达图对比各学科",
      "基于 5 篇经典认知科学论文的研究支撑",
    ],
    visual: <StatsDemo />,
  },
  {
    title: "AI 学习助手 · 你的私人教练",
    description: "对话式 AI 助手。4 种分析模式：诊断、大纲、要点、薄弱。基于你的真实数据生成个性化建议。",
    icon: <Brain className="w-8 h-8" />,
    tips: [
      "4 种快速分析：诊断 / 大纲 / 要点 / 薄弱",
      "对话式交互，流式打字 + AI 思考动画",
      "数据驱动：基于你最近 7 天的实际学习",
      "OpenAI GPT-4o 驱动，准确理解学习意图",
    ],
    visual: <AIAssistantDemo />,
  },
]

/* ===========================================================
   CINEMATIC STEP VIEW — 单步全屏视图
   =========================================================== */
interface StepViewProps {
  step: TutorialStepData
  stepNumber: number
  totalSteps: number
}

function StepView({ step, stepNumber, totalSteps }: StepViewProps) {
  const padded = String(stepNumber).padStart(2, "0")
  const totalPadded = String(totalSteps).padStart(2, "0")

  return (
    <div className="relative h-full w-full">
      {/* 巨大步骤编号 — 左上角水印 */}
      <div className="pointer-events-none absolute top-0 left-0 p-6 lg:p-12 xl:p-16 z-0">
        <div className="flex items-baseline gap-3 cinematic-number-reveal">
          <span
            className="font-display font-thin leading-none tracking-tighter select-none"
            style={{
              fontSize: "clamp(6rem, 13vw, 11rem)",
              color: "transparent",
              WebkitTextStroke: "1px rgba(232, 168, 124, 0.22)",
            }}
          >
            {padded}
          </span>
          <span className="font-mono text-xs text-gray-600 tracking-[0.3em] hidden sm:inline">
            / {totalPadded}
          </span>
        </div>
      </div>

      {/* 内容栅格：左文 右图 */}
      <div className="relative z-10 grid h-full grid-cols-1 lg:grid-cols-2 gap-8 px-6 sm:px-10 lg:px-16 xl:px-24 py-16 lg:py-20">
        {/* 左侧：文字 */}
        <div className="flex flex-col justify-center max-w-xl">
          {/* 步骤标签 */}
          <div
            className="flex items-center gap-4 mb-6 cinematic-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <span className="h-px w-12 bg-amber-500 cinematic-line-grow" />
            <span className="text-amber-400 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:inline [&>svg]:mr-2 [&>svg]:align-[-2px]">
              {step.icon}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-amber-400/80">
              Step {padded} / {totalPadded}
            </span>
          </div>

          {/* 标题 */}
          <h2
            className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold text-white tracking-tight mb-6 cinematic-fade-up"
            style={{ animationDelay: "220ms" }}
          >
            {step.title}
          </h2>

          {/* 描述 */}
          <p
            className="text-base lg:text-lg text-gray-400 leading-relaxed max-w-xl mb-10 cinematic-fade-up"
            style={{ animationDelay: "320ms" }}
          >
            {step.description}
          </p>

          {/* 要点 — 细线编号列表，非圆点 */}
          {step.tips && step.tips.length > 0 && (
            <ul className="max-w-xl">
              {step.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-5 py-4 border-t border-white/[0.06] cinematic-fade-up"
                  style={{ animationDelay: `${420 + i * 110}ms` }}
                >
                  <span className="font-mono text-[11px] text-amber-500/70 mt-0.5 tracking-[0.2em] shrink-0 w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-gray-300 leading-relaxed flex-1">
                    {tip}
                  </span>
                </li>
              ))}
              <li className="border-t border-white/[0.06]" aria-hidden="true" />
            </ul>
          )}
        </div>

        {/* 右侧：视觉演示 */}
        <div className="hidden lg:flex items-center justify-center">
          <div
            className="relative p-8 xl:p-10 rounded-sm border border-white/[0.08] bg-white/[0.015] cinematic-fade-up"
            style={{ animationDelay: "440ms" }}
          >
            {/* 顶部琥珀细线装饰 */}
            <span
              className="absolute -top-px left-8 h-px w-16 bg-amber-500/70 cinematic-line-grow"
              style={{ animationDelay: "600ms" }}
            />
            {step.visual}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===========================================================
   MAIN TUTORIAL COMPONENT — 电影感全屏引导
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
      setCurrentStep(s => s + 1)
    } else {
      complete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(s => s - 1)
    }
  }

  // 键盘导航
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (currentStep < steps.length - 1) {
          setDirection(1)
          setCurrentStep(s => s + 1)
        } else {
          complete()
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) {
          setDirection(-1)
          setCurrentStep(s => s - 1)
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
  const slideClass = direction === 1 ? "cinematic-slide-in" : "cinematic-slide-in-reverse"

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-[#0a0a14]"
      role="dialog"
      aria-modal="true"
      aria-label="新手引导"
    >
      {/* 顶部栏：跳过按钮（极简、纯文字、右上角） */}
      <div className="flex items-center justify-between px-6 sm:px-10 lg:px-16 pt-6 lg:pt-8 shrink-0">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-gray-600">
          Memory · Starmap
        </span>
        <button
          onClick={complete}
          className="text-sm text-gray-500 hover:text-amber-400 transition-colors duration-200 tracking-wide"
        >
          跳过
        </button>
      </div>

      {/* 主内容区：全屏步骤视图，横向滑动 + 渐显过渡 */}
      <div className="relative flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        <div key={currentStep} className={cn("absolute inset-0", slideClass)}>
          <StepView
            step={step}
            stepNumber={currentStep + 1}
            totalSteps={steps.length}
          />
        </div>
      </div>

      {/* 底部栏：细线进度 + 导航按钮 */}
      <div className="shrink-0 px-6 sm:px-10 lg:px-16 pb-8 pt-6">
        {/* 进度细线 */}
        <div className="mb-5">
          <div className="relative h-px w-full bg-white/[0.08] overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-gray-600">
            <span>
              {String(currentStep + 1).padStart(2, "0")}{" "}
              <span className="text-gray-700">/ {String(steps.length).padStart(2, "0")}</span>
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* 导航 */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={cn(
              "text-sm tracking-wide transition-colors duration-200",
              currentStep === 0
                ? "text-gray-700 cursor-not-allowed"
                : "text-gray-400 hover:text-white"
            )}
          >
            上一步
          </button>

          <button
            onClick={handleNext}
            className="group flex items-center gap-3 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium tracking-wide transition-all duration-300 active:scale-[0.98]"
          >
            {isLast ? "开始使用" : "继续"}
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
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
