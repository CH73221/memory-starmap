import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { StudyPlan } from "@/types"
import { Calendar, Target, CheckCircle2, Edit3, Trash2, Pause, RotateCcw } from "lucide-react"

const COLOR_MAP: Record<string, { bg: string; text: string; solid: string; light: string; border: string }> = {
  violet: { bg: "bg-ink-50", text: "text-ink-700", solid: "bg-ink-700", light: "bg-ink-50", border: "border-ink-300/30" },
  teal: { bg: "bg-success-bg", text: "text-success", solid: "bg-success", light: "bg-success-bg", border: "border-success/30" },
  rose: { bg: "bg-error-bg", text: "text-error", solid: "bg-error", light: "bg-error-bg", border: "border-error/30" },
  amber: { bg: "bg-amber-50", text: "text-amber", solid: "bg-amber", light: "bg-amber-50", border: "border-amber/30" },
  blue: { bg: "bg-ink-50", text: "text-ink-600", solid: "bg-ink-600", light: "bg-ink-50", border: "border-ink-300/30" },
  indigo: { bg: "bg-ink-50", text: "text-ink-700", solid: "bg-ink-700", light: "bg-ink-50", border: "border-ink-300/30" },
  purple: { bg: "bg-ink-50", text: "text-ink-700", solid: "bg-ink-700", light: "bg-ink-50", border: "border-ink-300/30" },
  emerald: { bg: "bg-success-bg", text: "text-success", solid: "bg-success", light: "bg-success-bg", border: "border-success/30" },
}

interface Props {
  plan: StudyPlan
  onEdit: (plan: StudyPlan) => void
  onDelete: (id: number) => void
  onCheckIn: (plan: StudyPlan) => void
  onTogglePause: (plan: StudyPlan) => void
}

export function StudyPlanCard({ plan, onEdit, onDelete, onCheckIn, onTogglePause }: Props) {
  const c = COLOR_MAP[plan.color] || COLOR_MAP.violet
  const isCompleted = plan.status === "completed"
  const isPaused = plan.status === "paused"
  const todayDone = plan.today_progress >= plan.daily_target

  return (
    <Card className={cn(
      "overflow-hidden bg-white border-border shadow-sm hover:shadow-md transition-shadow group relative",
      isCompleted && "border-success/30",
      isPaused && "opacity-70"
    )}>
      {/* Top accent bar - 3px solid color */}
      <div className={cn(
        "h-[3px]",
        c.solid,
      )} />

      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0", c.light, "border", c.border)}>
              {plan.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-base font-extrabold text-ink-800 truncate font-display">{plan.title}</h3>
                {isCompleted && <Badge variant="success" className="text-[10px]"><CheckCircle2 className="w-3 h-3 mr-0.5" /> 已完成</Badge>}
                {isPaused && <Badge variant="secondary" className="text-[10px]"><Pause className="w-3 h-3 mr-0.5" /> 已暂停</Badge>}
              </div>
              {plan.description && <p className="text-xs text-ink-500 line-clamp-1">{plan.description}</p>}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onEdit(plan)}>
              <Edit3 className="w-3.5 h-3.5 text-ink-400" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-error-bg" onClick={() => onDelete(plan.id)}>
              <Trash2 className="w-3.5 h-3.5 text-error" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "总目标", val: plan.target_count },
            { label: "每日", val: plan.daily_target },
            { label: "剩余天", val: plan.days_remaining },
          ].map((s, i) => (
            <div key={i} className={cn("p-2.5 rounded-lg text-center", c.light, "border", c.border)}>
              <p className={cn("text-xl font-extrabold font-display", c.text)}>{s.val}</p>
              <p className="text-[10px] text-ink-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 text-[11px]">
            <span className="text-ink-500 font-medium">完成进度</span>
            <span className={cn("font-bold", c.text)}>{plan.completed_count} 天 · {plan.progress_percentage}%</span>
          </div>
          <Progress value={Math.min(100, plan.progress_percentage)} className={cn("h-2.5", plan.color === "amber" ? "" : "")} />
        </div>

        <div className={cn("flex items-center gap-3 p-3 rounded-lg border bg-ink-50 border-border")}>
          <div className="flex-1">
            <p className="text-[10px] text-ink-500 font-medium">今日打卡</p>
            <p className="text-sm font-bold text-ink-800">
              <span className={cn(todayDone ? "text-success" : "text-ink-700")}>{plan.today_progress}</span>
              <span className="text-ink-400"> / {plan.daily_target}</span>
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onCheckIn(plan)}
            disabled={isCompleted || isPaused}
            className={cn("rounded-lg h-9 px-4 font-semibold text-xs",
              todayDone
                ? "bg-success-bg text-success hover:bg-success-bg/80 border border-success/30"
                : cn(c.solid, "text-white hover:opacity-90")
            )}
          >
            {todayDone ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 今日完成</> : <><Target className="w-3.5 h-3.5 mr-1" /> 立即打卡</>}
          </Button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-ink-400 pt-1 border-t border-paper-200">
          <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{plan.start_date} → {plan.end_date}</span></div>
          <button onClick={() => onTogglePause(plan)} className="flex items-center gap-1 hover:text-ink-600 transition-colors" disabled={isCompleted}>
            {isPaused ? <><RotateCcw className="w-3 h-3" /> 继续</> : <><Pause className="w-3 h-3" /> 暂停</>}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
