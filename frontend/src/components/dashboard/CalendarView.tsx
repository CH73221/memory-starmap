import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface HeatmapDay {
  date: string
  count: number
}

interface Props {
  data: HeatmapDay[]
  className?: string
}

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"]
const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 9) return 3
  return 4
}

// 暖色调：浅黄 → 琥珀 → 墨蓝
const LEVEL_BG = [
  "bg-paper-200 text-ink-400",
  "bg-amber-50 text-amber-700",
  "bg-amber-200 text-amber-800",
  "bg-amber text-white",
  "bg-ink-800 text-white",
]

export function CalendarView({ data, className }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const countMap = useMemo(() => {
    const m = new Map<string, number>()
    data.forEach(d => m.set(d.date, d.count))
    return m
  }, [data])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const cells: Array<{ day: number; dateStr: string; count: number; isToday: boolean; isFuture: boolean } | null> = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    const count = countMap.get(dateStr) || 0
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
    const isFuture = new Date(year, month, d) > today
    cells.push({ day: d, dateStr, count, isToday, isFuture })
  }

  const totalThisMonth = cells.reduce((sum, c) => sum + (c?.count || 0), 0)
  const activeDays = cells.filter(c => c && c.count > 0).length

  const goPrev = () => setCurrentDate(new Date(year, month - 1, 1))
  const goNext = () => setCurrentDate(new Date(year, month + 1, 1))

  return (
    <div className={cn("rounded-xl border border-[var(--border-light)] bg-white p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrev}
          className="p-1.5 rounded-md hover:bg-paper-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-ink-400" strokeWidth={1.75} />
        </button>
        <div className="text-center">
          <h3 className="text-base font-display font-semibold text-ink-800">{year}年 {MONTH_NAMES[month]}</h3>
          <p className="text-xs text-ink-400 mt-0.5 font-sans">
            共 <span className="font-semibold text-amber">{totalThisMonth}</span> 次复习，
            活跃 <span className="font-semibold text-ink-600">{activeDays}</span> 天
          </p>
        </div>
        <button
          onClick={goNext}
          disabled={year === today.getFullYear() && month === today.getMonth()}
          className="p-1.5 rounded-md hover:bg-paper-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4 text-ink-400" strokeWidth={1.75} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_NAMES.map((name) => (
          <div key={name} className="text-center text-[11px] font-medium text-ink-400 py-1 font-sans uppercase tracking-wider">
            {name}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div key={`${year}-${month}`} className="route-enter grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />

          const level = getLevel(cell.count)
          return (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-md flex flex-col items-center justify-center text-xs font-medium relative",
                cell.isFuture
                  ? "bg-paper-100 text-ink-300"
                  : cn(LEVEL_BG[level]),
                cell.isToday && "ring-2 ring-ink-800 ring-offset-1 ring-offset-white"
              )}
              title={`${cell.dateStr}${cell.count > 0 ? ` · 复习 ${cell.count} 次` : ""}`}
            >
              <span className="text-[11px] font-sans">{cell.day}</span>
              {cell.count > 0 && !cell.isFuture && (
                <span className="text-[8px] opacity-80 mt-0.5 font-sans">{cell.count}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-4 text-[10px] text-ink-400 font-sans">
        <span>少</span>
        {LEVEL_BG.map((cls, i) => (
          <div key={i} className={cn("w-3 h-3 rounded-sm", cls.split(" ")[0])} />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}
