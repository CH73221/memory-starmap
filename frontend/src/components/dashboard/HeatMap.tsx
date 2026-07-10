import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

interface HeatmapData {
  date: string
  count: number
}

interface HeatMapProps {
  data: HeatmapData[]
  className?: string
}

// 暖色调：浅黄 → 琥珀 → 深墨蓝
const LEVEL_COLORS = [
  "#f5f3f0",   // 0 - 无复习（暖白纸）
  "#fdf4ec",   // 1 - 极少（浅黄/琥珀底）
  "#f2c9a6",   // 2 - 少（浅琥珀）
  "#c87941",   // 3 - 中（琥珀）
  "#1a1a2e",   // 4 - 多（墨蓝）
]

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 9) return 3
  return 4
}

const WEEKDAY_LABELS = ["", "一", "", "三", "", "五", ""]

export function HeatMap({ data, className }: HeatMapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 364)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const countMap = new Map<string, number>()
    data.forEach((d) => countMap.set(d.date, d.count))

    const weeks: { date: Date; count: number; dateStr: string }[][] = []
    const current = new Date(startDate)
    let currentWeek: { date: Date; count: number; dateStr: string }[] = []
    const monthLabels: { label: string; weekIndex: number }[] = []
    let lastMonth = -1

    while (current <= today) {
      const dateStr = current.toISOString().split("T")[0]
      const month = current.getMonth()

      if (current.getDay() === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek)
        currentWeek = []
      }

      if (current.getDay() === 0 && month !== lastMonth) {
        const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
        monthLabels.push({ label: monthNames[month], weekIndex: weeks.length })
        lastMonth = month
      }

      currentWeek.push({
        date: new Date(current),
        count: countMap.get(dateStr) || 0,
        dateStr,
      })

      current.setDate(current.getDate() + 1)
    }

    if (currentWeek.length > 0) weeks.push(currentWeek)

    return { weeks, monthLabels }
  }, [data])

  const cellSize = 13
  const cellGap = 3
  const totalSize = cellSize + cellGap
  const labelWidth = 28
  const topPadding = 20
  const svgWidth = weeks.length * totalSize + labelWidth + 10
  const svgHeight = 7 * totalSize + topPadding + 10

  return (
    <div className={cn("hover-lift overflow-x-auto", className)}>
      <div className="relative inline-block">
        <svg width={svgWidth} height={svgHeight} className="block">
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={labelWidth + m.weekIndex * totalSize}
              y={12}
              className="fill-ink-400 text-[10px]"
              style={{ fontFamily: "inherit" }}
            >
              {m.label}
            </text>
          ))}

          {WEEKDAY_LABELS.map((label, i) =>
            label ? (
              <text
                key={i}
                x={0}
                y={topPadding + i * totalSize + cellSize - 2}
                className="fill-ink-400 text-[10px]"
                style={{ fontFamily: "inherit" }}
              >
                {label}
              </text>
            ) : null
          )}

          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const level = getLevel(day.count)
              const x = labelWidth + wi * totalSize
              const y = topPadding + di * totalSize
              const isFuture = day.date > new Date()

              return (
                <rect
                  key={`${wi}-${di}`}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  ry={2}
                  fill={isFuture ? "transparent" : LEVEL_COLORS[level]}
                  className={cn(
                    "transition-all duration-150 cursor-pointer",
                    !isFuture && "animate-fade-in"
                  )}
                  style={{
                    animationDelay: `${wi * 8}ms`,
                    opacity: isFuture ? 0 : undefined,
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const container = e.currentTarget.closest(".relative")?.getBoundingClientRect()
                    if (container) {
                      const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
                      const dateStr = `${day.date.getMonth() + 1}月${day.date.getDate()}日 ${dayNames[day.date.getDay()]}`
                      const countStr = day.count === 0 ? "没有复习" : `复习了 ${day.count} 次`
                      setTooltip({
                        x: rect.left - container.left + rect.width / 2,
                        y: rect.top - container.top - 4,
                        text: `${dateStr}: ${countStr}`,
                      })
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })
          )}
        </svg>

        {tooltip && (
          <div
            className="heatmap-tooltip animate-fade-in"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-xs text-ink-400">
        <span>少</span>
        {LEVEL_COLORS.map((color, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
