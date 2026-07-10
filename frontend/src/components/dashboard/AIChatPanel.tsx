/**
 * AI 聊天面板 — 支持自由对话 + 快捷学习分析
 * 接通后端 /api/ai/chat，发送真实用户消息
 */

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import api from "@/services/api"
import { cn } from "@/lib/utils"
import { Send, Sparkles, Bot, User, Copy, Check } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  isFallback?: boolean
}

interface QuickAction {
  type: string
  label: string
  icon: string
  prompt: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { type: "diagnosis", label: "学习诊断", icon: "📊", prompt: "请给我一份完整的学习诊断报告" },
  { type: "weakness", label: "薄弱分析", icon: "⚠️", prompt: "分析我的薄弱知识点并给出改进建议" },
  { type: "outline", label: "生成大纲", icon: "📝", prompt: "根据我的学习数据生成复习大纲" },
  { type: "key_points", label: "核心要点", icon: "🎯", prompt: "总结我需要重点复习的核心知识点" },
]

const SUGGESTED_QUESTIONS = [
  "我该怎么安排今天的复习？",
  "我的学习进度怎么样？",
  "哪些知识点比较薄弱？",
  "帮我制定一个学习计划",
]

interface AIChatPanelProps {
  className?: string
}

export function AIChatPanel({ className = "" }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "你好！我是你的 AI 学习助手 ✨\n\n我可以帮你分析学习数据、制定复习计划、解答学习问题。你可以直接输入问题，或点击下方快捷按钮获取分析报告。",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (text?: string, type?: string) => {
    const messageText = text || input.trim()
    if (!messageText || loading) return

    const userMsg: Message = { role: "user", content: messageText }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const resp = await api.post("/ai/chat", {
        message: messageText,
        type: type || null,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      })
      const data = resp.data
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, isFallback: data.is_fallback },
      ])
    } catch (err) {
      console.error("AI chat error:", err)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "抱歉，AI 服务暂时不可用。请稍后再试，或检查网络连接。",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleCopy = (idx: number, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-paper-50/50 rounded-2xl border border-[var(--border-light)] overflow-hidden",
      className,
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-light)] bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ink-800 flex items-center justify-center relative">
            <Sparkles className="w-4 h-4 text-amber" />
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-success memory-pulse"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-800 font-sans">AI 学习助手</h3>
            <p className="text-[10px] text-ink-400 font-sans">智能问答 · 学习分析</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success memory-pulse" />
          <span className="text-[9px] uppercase tracking-widest text-ink-400 font-sans">在线</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[300px] max-h-[500px]">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-amber/15" : "bg-ink-800",
                )}
              >
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5 text-amber" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-white" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "group relative max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-ink-800 text-white rounded-tr-sm"
                    : "bg-white text-ink-700 border border-[var(--border-light)] rounded-tl-sm",
                )}
              >
                <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                {msg.role === "assistant" && (
                  <button
                    onClick={() => handleCopy(idx, msg.content)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-paper-100"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3 text-ink-300" />
                    )}
                  </button>
                )}
                {msg.isFallback && (
                  <span className="block mt-2 text-[10px] text-ink-400 border-t border-[var(--border-light)] pt-1.5">
                    ⚡ 本地智能回复 · 配置 API Key 可获得更强 AI 对话
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-ink-800 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-[var(--border-light)] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-ink-300"
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3">
          <p className="text-[10px] text-ink-400 mb-2 font-sans uppercase tracking-widest">快捷分析</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.type}
                onClick={() => sendMessage(action.prompt, action.type)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-light)] bg-white hover:bg-paper-100 hover:border-ink-200 transition-all text-left disabled:opacity-50 group hover-lift"
              >
                <span className="text-base">{action.icon}</span>
                <span className="text-xs font-medium text-ink-700 font-sans group-hover:text-ink-900">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full bg-paper-100 hover:bg-paper-200 text-[11px] text-ink-500 hover:text-ink-700 font-sans transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-[var(--border-light)] bg-white/60 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="问我任何学习问题..."
            rows={1}
            className="flex-1 resize-none bg-paper-50 border border-[var(--border-light)] rounded-xl px-4 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-ink-300 focus:ring-2 focus:ring-ink-200/30 transition-all font-sans max-h-32"
            style={{ minHeight: "42px" }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-ink-800 hover:bg-ink-900 disabled:bg-ink-300 flex items-center justify-center shrink-0 transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
