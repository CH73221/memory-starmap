import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { noteService } from "@/services/noteService"
import type { NoteListItem } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { FadeIn } from "@/components/ui/page-transition"
import {
  FileText, Plus, Search, Calendar, Sparkles, Trash2, ChevronRight, Hash,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function NotesListPage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<NoteListItem[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      const r = await noteService.list(search)
      setNotes(r.items)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search])

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return
    try {
      const n = await noteService.create({ title, content: "" })
      navigate(`/app/notes/${encodeURIComponent(n.title)}`)
    } catch (e: any) { alert(e.response?.data?.detail || "创建失败") }
  }

  const handleOpenDaily = async () => {
    try {
      const n = await noteService.openDaily()
      navigate(`/app/notes/${encodeURIComponent(n.title)}`)
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("确定删除该笔记？此操作不可恢复。")) return
    try { await noteService.delete(id); load() } catch (e) { console.error(e) }
  }

  // 分组：Daily / Auto-created / Normal
  const grouped = useMemo(() => {
    const daily: NoteListItem[] = []
    const normal: NoteListItem[] = []
    for (const n of notes) {
      if (n.is_daily) daily.push(n)
      else normal.push(n)
    }
    return { daily, normal }
  }, [notes])

  return (
    <div className="space-y-6">
      <FadeIn className="spring-enter">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold font-display text-ink-800 flex items-center gap-2">
              <FileText className="w-7 h-7 text-ink-700" />
              双链笔记
            </h1>
            <p className="text-ink-500 mt-1 font-sans text-sm">
              用 <code className="text-ink-700 bg-ink-50 px-1.5 py-0.5 rounded text-xs border border-border font-mono">[[标题]]</code> 创建双链，Obsidian 风格的知识网络
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={handleOpenDaily} className="rounded-lg">
              <Calendar className="w-4 h-4 mr-2 text-amber" /> 今日笔记
            </Button>
            <Button onClick={() => setShowCreate(true)} className="rounded-lg">
              <Plus className="w-4 h-4 mr-2" /> 新建笔记
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Create Modal */}
      {showCreate && (
        <FadeIn>
          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ink-50 border border-border flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-ink-700" />
              </div>
              <Input
                autoFocus
                placeholder="输入笔记标题..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                  if (e.key === "Escape") { setShowCreate(false); setNewTitle("") }
                }}
                className="flex-1 rounded-lg"
              />
              <Button onClick={handleCreate} disabled={!newTitle.trim()} className="rounded-lg">创建</Button>
              <Button variant="ghost" onClick={() => { setShowCreate(false); setNewTitle("") }} className="rounded-lg">取消</Button>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Search */}
      <FadeIn delay={100}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索笔记标题或内容..."
            className="pl-10 rounded-lg"
          />
        </div>
      </FadeIn>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : notes.length === 0 ? (
        <FadeIn delay={200}>
          <Card className="text-center py-16 border-dashed border-paper-300 bg-white">
            <CardContent>
              <FileText className="w-14 h-14 mx-auto text-ink-300 mb-4" />
              <h3 className="text-lg font-semibold text-ink-800 mb-2 font-display">还没有笔记</h3>
              <p className="text-ink-500 mb-6 max-w-md mx-auto text-sm">
                创建第一篇笔记，用 <code className="text-ink-700 bg-ink-50 px-1.5 py-0.5 rounded text-xs border border-border font-mono">[[标题]]</code> 创建双链，让知识形成网络
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowCreate(true)} className="rounded-lg">
                  <Plus className="w-4 h-4 mr-2" /> 新建笔记
                </Button>
                <Button variant="outline" onClick={handleOpenDaily} className="rounded-lg">
                  <Calendar className="w-4 h-4 mr-2" /> 打开今日笔记
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <div className="space-y-3">
          {/* Daily Notes */}
          {grouped.daily.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber font-bold uppercase tracking-wider px-2">
                <Calendar className="w-3.5 h-3.5" /> 每日笔记
              </div>
              {grouped.daily.map((n, idx) => (
                <NoteCard key={n.id} note={n} idx={idx} onClick={() => navigate(`/app/notes/${encodeURIComponent(n.title)}`)} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* Regular Notes */}
          <div className="space-y-2">
            {grouped.daily.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-ink-400 font-bold uppercase tracking-wider px-2 mt-4">
                <FileText className="w-3.5 h-3.5" /> 所有笔记
              </div>
            )}
            {grouped.normal.map((n, idx) => (
              <NoteCard key={n.id} note={n} idx={idx} onClick={() => navigate(`/app/notes/${encodeURIComponent(n.title)}`)} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, idx, onClick, onDelete }: { note: NoteListItem; idx: number; onClick: () => void; onDelete: (id: number, e: React.MouseEvent) => void }) {
  const tags = note.tags?.split(",").filter(Boolean) || []
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 p-4 rounded-lg bg-white border border-border shadow-sm hover:shadow-md cursor-pointer transition-shadow stagger-item"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      <div className="w-10 h-10 rounded-lg bg-ink-50 border border-border flex items-center justify-center shrink-0">
        {note.is_daily ? <Calendar className="w-5 h-5 text-amber" /> : <FileText className="w-5 h-5 text-ink-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <p className="text-sm font-semibold text-ink-800 truncate font-display">{note.title}</p>
          {note.is_auto_created && (
            <Badge variant="amber" className="rounded text-[9px] px-1 py-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" /> 自动
            </Badge>
          )}
          {tags.length > 0 && tags.map((t) => (
            <Badge key={t} variant="default" className="rounded text-[9px] px-1 py-0">
              <Hash className="w-2.5 h-2.5 mr-0.5" />{t}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-ink-400">{new Date(note.updated_at).toLocaleString("zh-CN")}</p>
      </div>
      <button
        onClick={(e) => onDelete(note.id, e)}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-ink-400 hover:text-error hover:bg-error-bg transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-ink-700 transition-colors" />
    </div>
  )
}
