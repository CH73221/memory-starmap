import { useState, useRef, useEffect } from "react"

interface NoteEditorProps {
  draft: { title: string; content: string }
  onChange: (content: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  noteTitles?: string[]
}

// Caret geometry estimates for the monospace textarea (text-sm, leading-relaxed)
const LINE_HEIGHT = 22.75
const CHAR_WIDTH = 8.4
const PAD = 24

export default function NoteEditor({ draft, onChange, textareaRef, noteTitles = [] }: NoteEditorProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteQuery, setAutocompleteQuery] = useState("")
  const [autocompleteStart, setAutocompleteStart] = useState(-1)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = showAutocomplete
    ? noteTitles.filter((t) => t.toLowerCase().includes(autocompleteQuery.toLowerCase())).slice(0, 8)
    : []

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    onChange(value)
    const caret = e.target.selectionStart ?? value.length
    const before = value.slice(0, caret)
    const bracketIdx = before.lastIndexOf("[[")
    const afterBracket = before.slice(bracketIdx + 2)
    if (bracketIdx === -1 || afterBracket.includes("]]") || afterBracket.includes("\n")) {
      setShowAutocomplete(false)
      return
    }
    setAutocompleteStart(bracketIdx)
    setAutocompleteQuery(afterBracket)
    setSelectedIndex(0)
    setShowAutocomplete(true)
    const lastNl = before.lastIndexOf("\n")
    const row = before.match(/\n/g)?.length ?? 0
    const col = caret - (lastNl + 1)
    const containerW = containerRef.current?.clientWidth ?? 600
    const left = Math.min(PAD + col * CHAR_WIDTH, Math.max(PAD, containerW - 256 - 12))
    setDropdownPos({
      top: PAD + (row + 1) * LINE_HEIGHT - (textareaRef.current?.scrollTop ?? 0) + 4,
      left,
    })
  }

  const selectTitle = (title: string) => {
    const ta = textareaRef.current
    const insert = `[[${title}]]`
    const before = draft.content.slice(0, autocompleteStart)
    const after = draft.content.slice(autocompleteStart + 2 + autocompleteQuery.length)
    onChange(before + insert + after)
    setShowAutocomplete(false)
    const cursorPos = before.length + insert.length
    requestAnimationFrame(() => { ta?.focus(); ta?.setSelectionRange(cursorPos, cursorPos) })
  }

  // Keyboard navigation while autocomplete is open
  useEffect(() => {
    if (!showAutocomplete) return
    const ta = textareaRef.current
    if (!ta) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1))) }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)) }
      else if (e.key === "Enter" && filtered.length > 0) { e.preventDefault(); selectTitle(filtered[selectedIndex]) }
      else if (e.key === "Escape") { e.preventDefault(); setShowAutocomplete(false) }
    }
    ta.addEventListener("keydown", onKey)
    return () => ta.removeEventListener("keydown", onKey)
  }, [showAutocomplete, filtered, selectedIndex])

  return (
    <div ref={containerRef} className="relative">
      <textarea
        ref={textareaRef}
        value={draft.content}
        onChange={handleChange}
        onBlur={() => setShowAutocomplete(false)}
        placeholder="开始书写...&#10;&#10;支持 Markdown:&#10;# 标题&#10;**粗体** `代码`&#10;- 列表&#10;&#10;支持双链: [[另一个笔记]]&#10;支持标签: #学习 #算法"
        className="w-full min-h-[600px] p-6 outline-none resize-none text-sm leading-relaxed bg-transparent text-ink-800 placeholder:text-ink-300 font-sans"
        style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace", caretColor: "#1a1a2e" }}
      />
      {showAutocomplete && filtered.length > 0 && (
        <div
          className="absolute z-50 bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-y-auto w-64 animate-fade-in"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {filtered.map((title, i) => (
            <div
              key={title}
              onMouseDown={(e) => { e.preventDefault(); selectTitle(title) }}
              className={`px-3 py-2 text-sm cursor-pointer text-ink-700 ${i === selectedIndex ? "bg-amber/10" : "hover:bg-amber/10"}`}
            >
              <span className="block truncate">{title}</span>
              {i === 0 && <span className="text-[10px] text-ink-300">Enter to select</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
