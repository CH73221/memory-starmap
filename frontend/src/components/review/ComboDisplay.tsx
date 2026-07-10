import { cn } from "@/lib/utils"

export default function ComboDisplay({ combo }: { combo: number }) {
  if (combo < 2) return null

  const isHighCombo = combo >= 10
  const isMediumCombo = combo >= 5
  const label = combo >= 15 ? "出色" : combo >= 10 ? "连击" : combo >= 5 ? "不错" : "连对"

  return (
    <div className={cn(
      "flex flex-col items-center gap-2 mb-4 animate-fade-in",
      isHighCombo && "amber-glow rounded-xl"
    )}>
      <div className="flex items-baseline gap-2">
        <span
          key={combo}
          className={cn(
            "number-pop text-3xl md:text-4xl font-display font-semibold tabular-nums",
            isHighCombo && "font-bold"
          )}
          style={{ color: isMediumCombo ? "#c87941" : "#1a1a2e" }}
        >
          {combo}
        </span>
        <span className="text-xs font-medium text-ink-400 uppercase tracking-widest font-sans">
          × {label}
        </span>
      </div>

      {/* 细线连击条 — 带连线脉冲呼吸 */}
      {combo >= 3 && (
        <div className="w-32 h-[2px] bg-[var(--border-light)] rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", isHighCombo && "line-pulse")}
            style={{
              width: `${Math.min(combo * 10, 100)}%`,
              backgroundColor: isHighCombo ? "#c87941" : "#1a1a2e",
            }}
          />
        </div>
      )}
    </div>
  )
}
