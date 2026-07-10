import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { noteService } from "@/services/noteService"
import { useToast } from "@/components/ui/toast"
import type { NoteResponse } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { FadeIn } from "@/components/ui/page-transition"
import { BacklinksPanel } from "@/components/notes/BacklinksPanel"
import { ForwardLinksPanel } from "@/components/notes/ForwardLinksPanel"
import NoteToolbar from "@/components/notes/NoteToolbar"
import NoteEditor from "@/components/notes/NoteEditor"
import NoteViewer from "@/components/notes/NoteViewer"
import { FileText, Sparkles } from "lucide-react"

export default function NoteEditorPage() {
  const { title: titleParam } = useParams<{ title: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [note, setNote] = useState<NoteResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: "", content: "" })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [noteTitles, setNoteTitles] = useState<string[]>([])
  const saveTimerRef = useRef<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    if (!titleParam) return
    setLoading(true)
    try {
      const n = await noteService.getByTitle(decodeURIComponent(titleParam))
      setNote(n)
      setDraft({ title: n.title, content: n.content })
    } catch (e) {
      // 笔记不存在，自动创建
      try {
        const n = await noteService.ensure({ title: decodeURIComponent(titleParam), content: "" })
        setNote(n)
        setDraft({ title: n.title, content: n.content })
        setEditing(true) // 自动创建的笔记直接进入编辑模式
      } catch (e2) { console.error(e2) }
    } finally { setLoading(false) }
  }, [titleParam])

  useEffect(() => { load() }, [load])

  // 获取所有笔记标题用于 [[自动补全
  useEffect(() => {
    noteService.list().then((d) => setNoteTitles(d.items.map((n) => n.title))).catch(() => {})
  }, [])

  // 自动保存（debounce 1.2s）
  useEffect(() => {
    if (!editing || !note) return
    if (draft.title === note.title && draft.content === note.content) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(async () => {
      if (!draft.title.trim()) {
        addToast({ title: "标题不能为空", description: "请输入笔记标题后再保存", variant: "error" })
        return
      }
      try {
        setSaving(true)
        const updated = await noteService.update(note.id, { title: draft.title, content: draft.content })
        setNote(updated)
        setLastSaved(new Date())
        // 标题变化时跳转新 URL
        if (updated.title !== note.title) {
          navigate(`/app/notes/${encodeURIComponent(updated.title)}`, { replace: true })
        }
      } catch (e) { console.error(e) } finally { setSaving(false) }
    }, 1200)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [draft, editing, note, navigate, addToast])

  // 处理 [[X]] 点击：在编辑模式中光标定位到链接后，非编辑模式跳转
  const handleWikiClick = useCallback(async (target: string) => {
    if (editing) {
      // 编辑模式：光标移到 [[X]] 之后
      const ta = textareaRef.current
      if (!ta) return
      const before = ta.value.substring(0, ta.selectionStart || 0)
      const lastIdx = before.lastIndexOf(`[[${target}]]`)
      if (lastIdx >= 0) {
        ta.focus()
        const pos = lastIdx + `[[${target}]]`.length
        ta.setSelectionRange(pos, pos)
      }
    } else {
      // 非编辑模式：尝试跳转笔记，不存在则创建
      try {
        const n = await noteService.ensure({ title: target, content: "" })
        navigate(`/app/notes/${encodeURIComponent(n.title)}`)
      } catch (e) { console.error(e) }
    }
  }, [editing, navigate])

  const handleDelete = async () => {
    if (!note) return
    if (!confirm(`确定删除笔记「${note.title}」？`)) return
    try {
      await noteService.delete(note.id)
      navigate("/app/notes")
    } catch (e) { console.error(e) }
  }

  const handleTitleChange = (title: string) => {
    setDraft({ ...draft, title })
  }

  const handleContentChange = (content: string) => {
    setDraft({ ...draft, content })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  if (!note) {
    return (
      <Card className="text-center py-16 border-dashed border-paper-300 bg-white">
        <CardContent>
          <FileText className="w-12 h-12 mx-auto text-ink-300 mb-3" />
          <p className="text-ink-500">笔记加载失败</p>
          <Button onClick={() => navigate("/app/notes")} className="mt-4 rounded-lg">返回列表</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <FadeIn>
        <NoteToolbar
          note={note}
          editing={editing}
          onToggleEdit={() => setEditing(!editing)}
          onDelete={handleDelete}
          saving={saving}
          lastSaved={lastSaved}
          draft={draft}
          onTitleChange={handleTitleChange}
        />
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Editor / Preview */}
        <FadeIn delay={100}>
          <Card className="bg-white border-border shadow-sm">
            <CardContent className="p-0">
              {editing ? (
                <NoteEditor
                  draft={draft}
                  onChange={handleContentChange}
                  textareaRef={textareaRef}
                  noteTitles={noteTitles}
                />
              ) : (
                <NoteViewer content={note.content} onWikiClick={handleWikiClick} />
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Right side: Backlinks + Tips */}
        <FadeIn delay={200} className="space-y-4">
          <BacklinksPanel noteId={note.id} />
          <ForwardLinksPanel content={note.content} />

          <div className="rounded-lg bg-white border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber" />
              <h3 className="text-sm font-bold text-ink-700 font-display">写作小贴士</h3>
            </div>
            <ul className="text-xs text-ink-500 space-y-1.5 leading-relaxed">
              <li>• <code className="text-ink-700 bg-ink-50 px-1 py-0.5 rounded border border-border font-mono">[[标题]]</code> 创建双链</li>
              <li>• <code className="text-ink-700 bg-ink-50 px-1 py-0.5 rounded border border-border font-mono">[[标题|别名]]</code> 自定义显示</li>
              <li>• <code className="text-ink-700 bg-ink-50 px-1 py-0.5 rounded border border-border font-mono">#标签</code> 添加分类</li>
              <li>• <code className="text-ink-700 bg-ink-50 px-1 py-0.5 rounded border border-border font-mono">#一级/二级</code> 嵌套标签</li>
              <li>• <code className="text-ink-700 bg-ink-50 px-1 py-0.5 rounded border border-border font-mono">**粗体**</code> 和 <code className="text-ink-700 bg-ink-50 px-1 py-0.5 rounded border border-border font-mono">`代码`</code></li>
              <li>• 编辑模式自动保存</li>
            </ul>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
