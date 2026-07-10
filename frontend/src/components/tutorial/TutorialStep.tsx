import { useRef, useEffect, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TutorialStepProps {
  stepNumber: number
  totalSteps: number
  title: string
  description: string
  icon: ReactNode
  visual?: ReactNode
  tips?: string[]
  gradient: string
  onNext: () => void
  onSkip: () => void
  isLast: boolean
}

export function TutorialStep({
  stepNumber, totalSteps, title, description, icon, visual, tips, gradient, onNext, onSkip, isLast,
}: TutorialStepProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (contentRef.current) contentRef.current.scrollTop = 0 }, [stepNumber])

  return (
    <div className="flex flex-col max-h-[85vh] animate-scale-in">
      {/* Top decorative gradient */}
      <div className={cn("h-32 rounded-t-2xl bg-gradient-to-br relative overflow-hidden shrink-0", gradient)}>
        <div className="absolute inset-0 opacity-30">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white animate-float" style={{
              width: `${(i * 3 + 2) % 5 + 2}px`, height: `${(i * 3 + 2) % 5 + 2}px`,
              left: `${(i * 17 + 7) % 100}%`, top: `${(i * 23 + 11) % 100}%`,
              animationDelay: `${(i * 0.4) % 3}s`, animationDuration: `${(i * 0.5 + 3) % 4 + 3}s`,
            }} />
          ))}
        </div>
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
          <span className="text-white text-xs font-bold tracking-wider">STEP {stepNumber} / {totalSteps}</span>
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-white shadow-xl shadow-gray-100 flex items-center justify-center ring-4 ring-white animate-bounce-in">
          <div className={cn("w-full h-full rounded-2xl flex items-center justify-center bg-gradient-to-br text-white", gradient)}>{icon}</div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div ref={contentRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="pt-12 px-6 pb-6 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-4 max-w-md mx-auto">{description}</p>
          {visual && <div className="my-4">{visual}</div>}
          {tips && tips.length > 0 && (
            <ul className="text-left max-w-md mx-auto space-y-2 mb-5">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={cn("w-5 h-5 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5", gradient)}>{i + 1}</div>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4 space-y-3">
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn("h-1 rounded-full transition-all duration-500", i + 1 === stepNumber ? "w-8" : i + 1 < stepNumber ? "w-4" : "w-2", i + 1 <= stepNumber ? "bg-gradient-to-r" : "bg-gray-100", i + 1 <= stepNumber && gradient)} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button onClick={onSkip} className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-500 transition-colors rounded-lg hover:bg-gray-100">跳过引导</button>
          <button onClick={onNext} className={cn("flex-1 max-w-[200px] py-3 px-6 rounded-xl text-white font-bold text-sm shadow-lg transition-all duration-200 active:scale-95 bg-gradient-to-r hover:shadow-xl hover:-translate-y-0.5", gradient)}>
            {isLast ? "🚀 开始使用" : "下一步 →"}
          </button>
        </div>
      </div>
    </div>
  )
}
