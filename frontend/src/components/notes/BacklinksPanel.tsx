import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { noteService } from "@/services/noteService"
import type { BacklinkItem } from "@/types"
import { Link2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  noteId: number
}

export function BacklinksPanel({ noteId }: Props) {
  const navigate = useNavigate()
  const [items, setItems] = useState<BacklinkItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    noteService.backlinks(noteId).then((d) => {
      if (mounted) {
        setItems(d)
        setLoading(false)
      }
    }).catch(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [noteId])

  return (
    <div className="rounded-lg bg-white border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-ink-600" />
        <h3 className="text-sm font-bold text-ink-700 font-display">反向链接</h3>
        <span className="text-xs text-ink-400 ml-auto">{items.length}</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-12 rounded-lg bg-paper-100 animate-pulse" />
          <div className="h-12 rounded-lg bg-paper-100 animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-ink-400 py-3 text-center">尚无反向链接。在其他笔记中使用 <code className="text-ink-700 bg-ink-50 px-1 py-0.5 rounded border border-border font-mono">[[标题]]</code> 引用本文即可出现。</p>
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <button
              key={b.source_id}
              onClick={() => navigate(`/app/notes/${encodeURIComponent(b.source_title)}`)}
              className={cn(
                "w-full text-left p-3 rounded-lg bg-white border border-border",
                "hover:border-ink-400 hover:shadow-sm transition-all group"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm font-semibold text-ink-700 group-hover:text-ink-800 truncate flex-1 transition-colors font-display underline underline-offset-2">
                  {b.source_title}
                </p>
                <ExternalLink className="w-3 h-3 text-ink-300 group-hover:text-ink-500 transition-colors" />
              </div>
              {b.snippet && (
                <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">{b.snippet}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
