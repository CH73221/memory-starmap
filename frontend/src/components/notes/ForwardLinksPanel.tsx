import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { extractWikiLinks } from "@/lib/wikiLinks"
import { ArrowUpRight, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

export function ForwardLinksPanel({ content }: { content: string }) {
  const navigate = useNavigate()

  const links = useMemo(() => {
    const seen = new Set<string>()
    return extractWikiLinks(content).filter((l) => {
      if (seen.has(l.target)) return false
      seen.add(l.target)
      return true
    })
  }, [content])

  return (
    <div className="rounded-lg bg-white border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <ArrowUpRight className="w-4 h-4 text-ink-600" />
        <h3 className="text-sm font-bold text-ink-700 font-display">正向链接</h3>
        <span className="text-xs text-ink-400 ml-auto">{links.length}</span>
      </div>

      {links.length === 0 ? (
        <p className="text-xs text-ink-400 py-3 text-center">本文尚无正向链接。在内容中使用 <code className="text-ink-700 bg-ink-50 px-1 py-0.5 rounded border border-border font-mono">[[标题]]</code> 引用其他笔记即可出现。</p>
      ) : (
        <div className="space-y-2">
          {links.map((l) => (
            <button
              key={l.target}
              onClick={() => navigate(`/app/notes/${encodeURIComponent(l.target)}`)}
              className={cn(
                "w-full text-left p-3 rounded-lg bg-white border border-border",
                "hover:border-ink-400 hover:shadow-sm transition-all group"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm font-semibold text-ink-700 group-hover:text-ink-800 truncate flex-1 transition-colors font-display underline underline-offset-2">
                  {l.alias}
                </p>
                <ExternalLink className="w-3 h-3 text-ink-300 group-hover:text-ink-500 transition-colors" />
              </div>
              {l.alias !== l.target && (
                <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed">{l.target}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
