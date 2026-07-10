import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Sparkles, Trash2, Eye, Edit3 } from "lucide-react"
import type { NoteResponse } from "@/types"

interface NoteToolbarProps {
  note: NoteResponse
  editing: boolean
  onToggleEdit: () => void
  onDelete: () => void
  saving: boolean
  lastSaved: Date | null
  draft: { title: string; content: string }
  onTitleChange: (title: string) => void
}

export default function NoteToolbar({
  note,
  editing,
  onToggleEdit,
  onDelete,
  saving,
  lastSaved,
  draft,
  onTitleChange,
}: NoteToolbarProps) {
  const navigate = useNavigate()
  const tags = note.tags?.split(",").filter(Boolean) || []

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/notes")} className="rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={draft.title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-lg font-bold h-9 rounded-lg font-display"
            />
          ) : (
            <h1 className="text-2xl font-bold text-ink-800 flex items-center gap-2 truncate font-display">
              {note.is_daily && <Calendar className="w-5 h-5 text-amber shrink-0" />}
              {note.is_auto_created && <Sparkles className="w-5 h-5 text-amber shrink-0" />}
              <span className="truncate">{note.title}</span>
            </h1>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
            {saving ? (
              <span className="text-ink-600">保存中...</span>
            ) : lastSaved ? (
              <span className="text-ink-400">已保存 · {lastSaved.toLocaleTimeString("zh-CN")}</span>
            ) : (
              <span className="text-ink-400">最后更新 {new Date(note.updated_at).toLocaleString("zh-CN")}</span>
            )}
            {tags.length > 0 && (
              <>
                <span className="text-ink-300">·</span>
                {tags.map((t) => (
                  <Badge key={t} variant="default" className="rounded text-[9px] px-1.5 py-0">
                    #{t}
                  </Badge>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToggleEdit} className="rounded-lg">
          {editing ? (
            <>
              <Eye className="w-4 h-4 mr-1.5" /> 预览
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 mr-1.5" /> 编辑
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="rounded-lg hover:text-error hover:bg-error-bg"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
