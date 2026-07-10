/**
 * Wiki-link 解析与渲染（Obsidian 风格 [[标题]]）
 * 支持 [[标题]] / [[标题|别名]] / [[标题#锚点]]
 */

const WIKI_LINK_RE = /\[\[([^\[\]|#]+?)(?:\|([^\[\]]+?))?(?:#[^\[\]|]+?)?\]\]/g

export interface WikiLink {
  raw: string         // 原始 [[X]]
  target: string      // 目标标题
  alias: string       // 显示文本（= target if no alias）
  index: number       // 在原文中的位置
}

export function extractWikiLinks(text: string): WikiLink[] {
  const links: WikiLink[] = []
  let m: RegExpExecArray | null
  WIKI_LINK_RE.lastIndex = 0
  while ((m = WIKI_LINK_RE.exec(text)) !== null) {
    links.push({
      raw: m[0],
      target: m[1].trim(),
      alias: (m[2] ?? m[1]).trim(),
      index: m.index,
    })
  }
  return links
}

/** 简易 Markdown 渲染（Obsidian 风格：标题/粗体/代码/双链/标签/引用/任务列表/删除线/代码块） */
export function renderMarkdown(text: string, onWikiLink: (target: string) => void): React.ReactNode {
  if (!text) return null

  // Split by code blocks first (```...```)
  const codeBlockRe = /```([\s\S]*?)```/g
  const segments: React.ReactNode[] = []
  let lastIdx = 0
  let cm: RegExpExecArray | null
  let keyCounter = 0

  while ((cm = codeBlockRe.exec(text)) !== null) {
    if (cm.index > lastIdx) {
      segments.push(renderTextBlock(text.slice(lastIdx, cm.index), onWikiLink, keyCounter))
      keyCounter++
    }
    const code = cm[1].trim()
    segments.push(
      <pre key={`cb-${keyCounter++}`} style={{
        background: "#f5f3f0",
        border: "1px solid #ddd8d1",
        borderRadius: 8,
        padding: "12px 16px",
        margin: "12px 0",
        overflowX: "auto",
        fontFamily: "'JetBrains Mono', Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.6,
        color: "#25253d",
      }}>
        <code>{code}</code>
      </pre>
    )
    lastIdx = cm.index + cm[0].length
  }
  if (lastIdx < text.length) {
    segments.push(renderTextBlock(text.slice(lastIdx), onWikiLink, keyCounter))
  }
  return segments
}

function renderTextBlock(block: string, onLink: (t: string) => void, baseKey: number): React.ReactNode {
  const lines = block.split("\n")
  const out: React.ReactNode[] = []
  let key = baseKey * 1000
  lines.forEach((line, i) => {
    out.push(renderInline(line, onLink, key++))
    if (i < lines.length - 1) out.push(<br key={`br-${key}`} />)
  })
  return <>{out}</>
}

function renderInline(line: string, onLink: (t: string) => void, idx: number): React.ReactNode {
  // 水平分割线
  if (/^---+$/.test(line.trim())) {
    return <hr key={`hr-${idx}`} style={{ border: "none", borderTop: "1px solid #ddd8d1", margin: "16px 0" }} />
  }
  // H1/H2/H3
  let prefix: React.ReactNode = null
  let rest = line
  if (line.startsWith("### ")) {
    return <h4 key={`h4-${idx}`} style={{ fontSize: 14, fontWeight: 600, margin: "16px 0 6px", color: "#1a1a2e", fontFamily: "Fraunces, Georgia, serif", letterSpacing: "0.02em", textTransform: "uppercase" }}>{line.slice(4)}</h4>
  }
  else if (line.startsWith("## ")) {
    return <h3 key={`h3-${idx}`} style={{ fontSize: 20, fontWeight: 700, margin: "18px 0 8px", color: "#1a1a2e", fontFamily: "Fraunces, Georgia, serif" }}>{line.slice(3)}</h3>
  }
  else if (line.startsWith("# ")) {
    return <h2 key={`h2-${idx}`} style={{ fontSize: 26, fontWeight: 800, margin: "20px 0 10px", color: "#1a1a2e", fontFamily: "Fraunces, Georgia, serif", borderBottom: "1px solid #ebe8e3", paddingBottom: 8 }}>{line.slice(2)}</h2>
  }
  // 任务列表 — Obsidian 风格 checkbox
  else if (/^- \[ \] /.test(line)) {
    return (
      <div key={`task-${idx}`} style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "4px 0" }}>
        <span style={{ display: "inline-block", width: 16, height: 16, border: "1.5px solid #c9c2b8", borderRadius: 3, flexShrink: 0, marginTop: 2 }} />
        <span style={{ color: "#4a4a6a" }}>{renderInline(line.slice(6), onLink, idx + 100)}</span>
      </div>
    )
  }
  else if (/^- \[[xX]\] /.test(line)) {
    return (
      <div key={`task-${idx}`} style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "4px 0" }}>
        <span style={{ display: "inline-block", width: 16, height: 16, background: "#c87941", border: "1.5px solid #c87941", borderRadius: 3, flexShrink: 0, marginTop: 2, color: "#fff", fontSize: 11, textAlign: "center", lineHeight: "14px" }}>✓</span>
        <span style={{ color: "#9898b5", textDecoration: "line-through" }}>{renderInline(line.slice(6), onLink, idx + 100)}</span>
      </div>
    )
  }
  else if (line.startsWith("- ") || line.startsWith("* ")) { rest = "• " + line.slice(2) }
  else if (/^\d+\.\s/.test(line)) { rest = line }
  else if (line.startsWith("> ")) {
    // Blockquote
    const content = renderInline(line.slice(2), onLink, idx + 10000)
    return (
      <blockquote key={`bq-${idx}`} style={{
        borderLeft: "3px solid #c87941",
        paddingLeft: "14px",
        margin: "10px 0",
        color: "#4a4a6a",
        fontStyle: "italic",
        background: "#fdf4ec",
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingRight: "12px",
        borderRadius: "0 6px 6px 0",
      }}>
        {content}
      </blockquote>
    )
  }

  // 行内元素：wiki-link、bold、inline-code、strikethrough、#tag
  const parts: React.ReactNode[] = []
  const re = /(\[\[[^\[\]|#]+?(?:\|[^\[\]]+?)?(?:#[^\[\]|]+?)?\]\])|(\*\*[^*]+\*\*)|(`[^`\n]+`)|(~~[^~]+~~)|(#[A-Za-z][A-Za-z0-9_\/\-]*)/g
  let lastIdx = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(rest)) !== null) {
    if (m.index > lastIdx) parts.push(rest.slice(lastIdx, m.index))
    if (m[1]) {
      // wiki-link
      const linkMatch = m[1].match(/^\[\[([^\[\]|#]+?)(?:\|([^\[\]]+?))?(?:#[^\[\]|]+?)?\]\]$/)
      if (linkMatch) {
        const target = linkMatch[1].trim()
        const alias = (linkMatch[2] ?? linkMatch[1]).trim()
        parts.push(
          <button
            key={`wl-${idx}-${m.index}`}
            onClick={() => onLink(target)}
            style={{
              color: "#25253d",
              background: "transparent",
              padding: "0 2px",
              borderRadius: 3,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              transition: "color 0.15s ease",
              fontFamily: "inherit",
              fontSize: "inherit",
              textDecoration: "underline",
              textDecorationColor: "#c87941",
              textDecorationThickness: "1.5px",
              textUnderlineOffset: "2px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#c87941" }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#25253d" }}
          >
            {alias}
          </button>
        )
      } else {
        parts.push(m[1])
      }
    } else if (m[2]) {
      parts.push(<strong key={`bd-${idx}-${m.index}`} style={{ fontWeight: 700, color: "#1a1a2e" }}>{m[2].slice(2, -2)}</strong>)
    } else if (m[3]) {
      parts.push(<code key={`co-${idx}-${m.index}`} style={{
        background: "#f5f3f0",
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 12,
        fontFamily: "JetBrains Mono, monospace",
        color: "#25253d",
        border: "1px solid #ddd8d1",
      }}>{m[3].slice(1, -1)}</code>)
    } else if (m[4]) {
      // 删除线
      parts.push(<span key={`del-${idx}-${m.index}`} style={{ textDecoration: "line-through", color: "#9898b5" }}>{m[4].slice(2, -2)}</span>)
    } else if (m[5]) {
      // #tag — Obsidian 风格可点击标签
      const tagVal = m[5]
      parts.push(
        <button
          key={`tag-${idx}-${m.index}`}
          onClick={() => onLink(tagVal)}
          style={{
            color: "#c87941",
            background: "#fdf4ec",
            padding: "1px 6px",
            borderRadius: 4,
            fontSize: "0.85em",
            fontWeight: 500,
            border: "1px solid #f2c9a6",
            cursor: "pointer",
            transition: "all 0.15s ease",
            fontFamily: "inherit",
            display: "inline-block",
            lineHeight: 1.4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f9e4d2"; e.currentTarget.style.borderColor = "#c87941" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fdf4ec"; e.currentTarget.style.borderColor = "#f2c9a6" }}
        >
          {m[5]}
        </button>
      )
    }
    lastIdx = m.index + m[0].length
  }
  if (lastIdx < rest.length) parts.push(rest.slice(lastIdx))

  if (prefix) return <span key={`l-${idx}`}>{prefix} {parts}</span>
  return <span key={`l-${idx}`}>{parts}</span>
}
