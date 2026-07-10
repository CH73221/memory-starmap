import { FileText } from "lucide-react"
import { renderMarkdown } from "@/lib/wikiLinks"

interface NoteViewerProps {
  content: string
  onWikiClick: (target: string) => void
}

export default function NoteViewer({ content, onWikiClick }: NoteViewerProps) {
  return (
    <div
      className="p-6 min-h-[600px] text-sm leading-relaxed text-ink-700 font-sans"
      style={{ whiteSpace: "pre-wrap" }}
    >
      {content ? (
        renderMarkdown(content, onWikiClick)
      ) : (
        <div className="text-center py-20 text-ink-400">
          <FileText className="w-10 h-10 mx-auto mb-2 text-ink-300" />
          <p className="font-display text-ink-500">空白笔记</p>
          <p className="text-xs mt-1 text-ink-400">点击右上角「编辑」开始书写</p>
        </div>
      )}
    </div>
  )
}
