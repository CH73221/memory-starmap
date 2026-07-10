import { useState, useEffect } from "react"
import { studyPlanService } from "@/services/studyPlanService"
import type { StudyPlan, StudyPlanCreate } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FadeIn } from "@/components/ui/page-transition"
import { StudyPlanCard } from "@/components/study-plan/StudyPlanCard"
import { cn } from "@/lib/utils"
import {
  Calendar, Target, Plus, Sparkles, Flame, Trophy, Clock,
  Zap, BookOpen, CheckCircle2, Edit3, Trash2, X, Lightbulb, RotateCcw,
} from "lucide-react"

const COLOR_OPTIONS = [
  { value: "ink", label: "墨蓝", color: "#1a1a2e", text: "text-ink-800", bg: "bg-ink-50", border: "border-ink-300" },
  { value: "amber", label: "琥珀", color: "#c87941", text: "text-amber", bg: "bg-amber-50", border: "border-amber/30" },
  { value: "teal", label: "墨绿", color: "#5b8c5a", text: "text-success", bg: "bg-success-bg", border: "border-success/30" },
  { value: "rose", label: "赭红", color: "#b85450", text: "text-error", bg: "bg-error-bg", border: "border-error/30" },
  { value: "blue", label: "灰蓝", color: "#4a4a6a", text: "text-ink-600", bg: "bg-ink-50", border: "border-ink-300/30" },
]

// Map to the old color values for backward compatibility with existing data
const COLOR_MAP_TO_OLD: Record<string, string> = {
  ink: "violet",
  amber: "amber",
  teal: "teal",
  rose: "rose",
  blue: "blue",
}

const ICON_OPTIONS = ["📚", "📖", "✏️", "🎯", "🔥", "⚡", "🌟", "💎", "🚀", "🧠", "🎓", "🏆"]

const TEMPLATES = [
  { key: "newbie", icon: "🌱", title: "新手入门", desc: "14 天轻松入门", color: "teal", target: 140, daily: 10, days: 14 },
  { key: "monthly", icon: "📅", title: "月度系统复习", desc: "30 天稳扎稳打", color: "ink", target: 600, daily: 20, days: 30 },
  { key: "weekend", icon: "⚡", title: "周末强化", desc: "2 天高强度", color: "amber", target: 100, daily: 50, days: 2 },
  { key: "exam-week", icon: "🔥", title: "期末冲刺", desc: "7 天高强度复习", color: "rose", target: 210, daily: 30, days: 7 },
]

export default function StudyPlanPage() {
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<StudyPlan | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)

  const [form, setForm] = useState<StudyPlanCreate>({
    title: "", description: "", target_type: "flashcards",
    target_count: 100, daily_target: 20, duration_days: 14,
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 13 * 86400000).toISOString().split("T")[0],
    icon: "📚", color: "ink",
  })

  const loadPlans = async () => {
    try { setPlans(await studyPlanService.list()) } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { loadPlans() }, [])

  const resetForm = () => {
    setForm({ title: "", description: "", target_type: "flashcards", target_count: 100, daily_target: 20, duration_days: 14, start_date: new Date().toISOString().split("T")[0], end_date: new Date(Date.now() + 13 * 86400000).toISOString().split("T")[0], icon: "📚", color: "ink" })
    setEditingPlan(null)
  }

  const handleCreate = () => { resetForm(); setDialogOpen(true) }

  const handleEdit = (plan: StudyPlan) => {
    // Map old color names to new ones
    const colorMap: Record<string, string> = { violet: "ink", purple: "ink", indigo: "ink", emerald: "teal" }
    const mappedColor = colorMap[plan.color] || plan.color
    setEditingPlan(plan)
    setForm({ title: plan.title, description: plan.description || "", target_type: plan.target_type, target_material_id: plan.target_material_id, target_count: plan.target_count, daily_target: plan.daily_target, duration_days: plan.duration_days, start_date: plan.start_date, end_date: plan.end_date, icon: plan.icon, color: mappedColor })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个学习计划吗？")) return
    try { await studyPlanService.delete(id); loadPlans() } catch (e) { console.error(e) }
  }

  const handleCheckIn = async (plan: StudyPlan) => {
    try { await studyPlanService.checkIn(plan.id, plan.today_progress + plan.daily_target); loadPlans() } catch (e) { console.error(e) }
  }

  const handleTogglePause = async (plan: StudyPlan) => {
    try { await studyPlanService.update(plan.id, { status: plan.status === "paused" ? "active" : "paused" }); loadPlans() } catch (e) { console.error(e) }
  }

  const handleSubmit = async () => {
    try {
      // Map new color names back to old for API
      const submitForm = { ...form, color: form.color ? (COLOR_MAP_TO_OLD[form.color] || form.color) : form.color }
      if (editingPlan) { await studyPlanService.update(editingPlan.id, submitForm) } else { await studyPlanService.create(submitForm) }
      setDialogOpen(false); loadPlans()
    } catch (e: any) { alert(e.response?.data?.detail || "操作失败") }
  }

  const handleUseTemplate = async (key: string) => {
    try { await studyPlanService.createFromTemplate(key); setTemplatesOpen(false); loadPlans() } catch (e: any) { alert(e.response?.data?.detail || "创建失败") }
  }

  const activePlans = plans.filter(p => p.status === "active")
  const completedPlans = plans.filter(p => p.status === "completed")
  const todayProgressTotal = activePlans.reduce((s, p) => s + p.today_progress, 0)
  const todayTargetTotal = activePlans.reduce((s, p) => s + p.daily_target, 0)

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-32" /></CardContent></Card>)}</div></div>

  return (
    <div className="space-y-6">
      <FadeIn className="spring-enter">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-ink-800 flex items-center gap-2">
              <Target className="w-7 h-7 text-ink-700" />
              学习计划
            </h1>
            <p className="text-ink-500 mt-1 font-sans text-sm">制定个性化学习目标，跟踪每日进度</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTemplatesOpen(true)} className="rounded-lg">
              <Sparkles className="w-4 h-4 mr-2 text-amber" /> 快速模板
            </Button>
            <Button onClick={handleCreate} className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" /> 新建计划
            </Button>
          </div>
        </div>
      </FadeIn>

      {plans.length > 0 && (
        <FadeIn delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Calendar, label: "活跃计划", value: activePlans.length, col: "text-ink-800", iconBg: "bg-ink-50", iconColor: "text-ink-700" },
              { icon: Trophy, label: "已完成", value: completedPlans.length, col: "text-success", iconBg: "bg-success-bg", iconColor: "text-success" },
              { icon: Target, label: "今日完成", value: todayProgressTotal, col: "text-amber", iconBg: "bg-amber-50", iconColor: "text-amber", suffix: `/${todayTargetTotal}` },
              { icon: Flame, label: "总计划数", value: plans.length, col: "text-error", iconBg: "bg-error-bg", iconColor: "text-error" },
            ].map((s, i) => (
              <Card key={i} className="bg-white border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border border-border", s.iconBg)}>
                      <s.icon className={cn("w-5 h-5", s.iconColor)} />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 font-medium">{s.label}</p>
                      <p className="text-2xl font-extrabold font-display"><span className={s.col}>{s.value}</span><span className="text-sm text-ink-400">{s.suffix}</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeIn>
      )}

      {plans.length === 0 && (
        <FadeIn>
          <Card className="text-center py-16 border-dashed border-paper-300 bg-white">
            <CardContent>
              <Target className="w-14 h-14 mx-auto text-ink-300 mb-6" />
              <h3 className="text-xl font-bold text-ink-800 mb-2 font-display">开启你的第一个学习计划</h3>
              <p className="text-ink-500 mb-6 max-w-md mx-auto text-sm">制定目标、跟踪进度。让学习更有方向感，每天都能看到自己的进步。</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="outline" onClick={() => setTemplatesOpen(true)} className="rounded-lg">
                  <Sparkles className="w-4 h-4 mr-2" /> 选择快速模板
                </Button>
                <Button onClick={handleCreate} className="rounded-lg">
                  <Plus className="w-4 h-4 mr-2" /> 自定义计划
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <div key={plan.id} className="stagger-item" style={{ animationDelay: `${i * 80}ms` }}>
              <StudyPlanCard plan={plan} onEdit={handleEdit} onDelete={handleDelete} onCheckIn={handleCheckIn} onTogglePause={handleTogglePause} />
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-lg rounded-xl bg-white border-border p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-ink-800 font-display">
              <div className="w-8 h-8 rounded-lg bg-ink-800 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              {editingPlan ? "编辑学习计划" : "新建学习计划"}
            </DialogTitle>
            <DialogDescription className="text-ink-500">设定目标，开始你的学习之旅</DialogDescription>
          </DialogHeader>

          <div className="px-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-ink-700 text-sm font-medium">计划名称</Label>
              <Input placeholder="例如：30 天掌握线性代数" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label className="text-ink-700 text-sm font-medium">描述（可选）</Label>
              <Textarea placeholder="简要描述这个计划的目标..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-lg resize-none" rows={2} />
            </div>
            <div className="space-y-2">
              <Label className="text-ink-700 text-sm font-medium">图标</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(icon => (
                  <button key={icon} onClick={() => setForm({ ...form, icon })} className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all border", form.icon === icon ? "bg-ink-50 ring-2 ring-ink-700/30 scale-105 border-ink-300" : "bg-white border-border hover:bg-paper-100")}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-ink-700 text-sm font-medium">主题色</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button key={c.value} onClick={() => setForm({ ...form, color: c.value })} className={cn("w-12 h-8 rounded-lg transition-all border-2", form.color === c.value ? "ring-2 ring-offset-2 ring-ink-700/30 scale-110 border-white" : "border-transparent")} style={{ backgroundColor: c.color }} title={c.label} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-ink-700 text-sm font-medium">总目标数量</Label><Input type="number" value={form.target_count} onChange={e => setForm({ ...form, target_count: parseInt(e.target.value) || 0 })} className="rounded-lg" /></div>
              <div className="space-y-2"><Label className="text-ink-700 text-sm font-medium">每日目标</Label><Input type="number" value={form.daily_target} onChange={e => setForm({ ...form, daily_target: parseInt(e.target.value) || 0 })} className="rounded-lg" /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-ink-700 text-sm font-medium">计划时长</Label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 14, 30, 60].map(d => (
                  <button key={d} onClick={() => { const start = new Date(form.start_date); const end = new Date(start.getTime() + (d - 1) * 86400000); setForm({ ...form, duration_days: d, end_date: end.toISOString().split("T")[0] }) }} className={cn("py-2 rounded-lg text-sm font-semibold transition-all border", form.duration_days === d ? "bg-ink-800 text-white border-ink-800" : "bg-white text-ink-600 hover:bg-paper-100 border-border")}>
                    {d}天
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-ink-700 text-sm font-medium">开始日期</Label><Input type="date" value={form.start_date} onChange={e => { const start = new Date(e.target.value); const end = new Date(start.getTime() + (form.duration_days - 1) * 86400000); setForm({ ...form, start_date: e.target.value, end_date: end.toISOString().split("T")[0] }) }} className="rounded-lg" /></div>
              <div className="space-y-2"><Label className="text-ink-700 text-sm font-medium">结束日期</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="rounded-lg" /></div>
            </div>
            <div className="p-3 rounded-lg bg-ink-50 border border-border flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-ink-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink-600">提示：合理的目标更容易坚持。建议每日目标不超过 {Math.floor(form.target_count / Math.max(1, form.duration_days))} 张卡片。</p>
            </div>
          </div>

          <DialogFooter className="p-6 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg">取消</Button>
            <Button onClick={handleSubmit} className="rounded-lg">{editingPlan ? "保存修改" : "创建计划"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent className="max-w-lg rounded-xl bg-white border-border p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-ink-800 font-display">
              <Sparkles className="w-5 h-5 text-amber" /> 选择快速模板
            </DialogTitle>
            <DialogDescription className="text-ink-500">为常见学习场景预设的计划，一键启用</DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.map((t, i) => {
                const c = COLOR_OPTIONS.find(o => o.value === t.color)!
                return (
                  <button key={t.key} onClick={() => handleUseTemplate(t.key)} className="group p-4 rounded-lg border border-border bg-white hover:border-ink-300 hover:shadow-sm transition-all text-left animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="flex items-start gap-3">
                      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-2xl border", c.bg, c.border)}>{t.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink-800 font-display">{t.title}</p>
                        <p className="text-[11px] text-ink-500 mt-0.5">{t.desc}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-[9px]">{t.days}天</Badge>
                          <Badge variant="outline" className="text-[9px]">{t.target}张</Badge>
                          <Badge variant="outline" className="text-[9px]">每日{t.daily}</Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter className="p-6 pt-2">
            <Button variant="outline" onClick={() => setTemplatesOpen(false)} className="rounded-lg">关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
