/**
 * ObsidianGraph — 高保真还原 Obsidian Graph View
 *
 * 核心视觉特征（基于官方文档+主题CSS逆向）：
 * - 暗色背景 (#1e1e1e)，纯色无纹理
 * - 实心圆节点，无发光/阴影，大小 = base + degree * scale
 * - 静态直线连线，低透明度灰 (rgba(120,120,120,0.25))
 * - 节点颜色：内容笔记=#bdbdbd, 占位=#5a5a5a, 聚焦=#7a9acc
 * - 标签文字随缩放渐隐
 * - Hover 时连接子图高亮，非相关节点淡化
 * - d3-force 风格物理参数
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { noteService } from "@/services/noteService"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ZoomIn, ZoomOut, Maximize, Network, FileText, Search, X, Settings,
} from "lucide-react"

// ===== Obsidian 色板（暗色主题） =====
const COLORS = {
  bg: "#1e1e1e",
  node: "#bdbdbd",           // 默认节点 — 中性浅灰
  nodeUnresolved: "#5a5a5a",  // 未解析/占位节点 — 暗灰
  nodeFocused: "#7a9acc",     // 聚焦节点 — 低饱和蓝灰
  nodeTag: "#8ab4d8",         // 标签类节点 — 偏蓝
  nodeAttachment: "#d4a86a",  // 附件类节点 — 偏橙
  line: "rgba(120, 120, 120, 0.25)",  // 连线 — 低透明灰
  lineHighlight: "rgba(140, 170, 210, 0.6)", // 高亮连线
  text: "#a8a8a8",            // 标签文字
  textBright: "#d0d0d0",      // 高亮标签
  panel: "#252525",           // 面板背景
  border: "#333333",          // 面板边框
}

interface GraphNode {
  id: string
  title: string
  val: number
  is_auto_created: boolean
  has_content: boolean
  x: number
  y: number
  vx: number
  vy: number
  degree: number
}

interface GraphLink {
  source: string
  target: string
}

export default function MemoryPalacePage() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingNode, setIsDraggingNode] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showFilters, setShowFilters] = useState(false)
  const [nodeSize, setNodeSize] = useState(1)
  const [linkDistance, setLinkDistance] = useState(80)
  const [repelForce, setRepelForce] = useState(0.5)
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Physics refs
  const nodesRef = useRef<GraphNode[]>([])
  const linksRef = useRef<GraphLink[]>([])
  const rafRef = useRef<number>(0)
  const tickCount = useRef(0)
  const settledFrames = useRef(0)
  const zoomRef = useRef(1)
  const offsetRef = useRef({ x: 0, y: 0 })
  const hoveredRef = useRef<GraphNode | null>(null)
  const selectedRef = useRef<GraphNode | null>(null)
  const searchRef = useRef("")
  const nodeSizeRef = useRef(1)
  const linkDistRef = useRef(80)
  const repelRef = useRef(0.5)
  const isDraggingNodeRef = useRef(false)
  const dragNodeRef = useRef<GraphNode | null>(null)
  const mousePosRef = useRef({ x: 0, y: 0 })
  const selectedTagRef = useRef<string | null>(null)
  const tagMapRef = useRef<Map<string, Set<string>>>(new Map())

  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { offsetRef.current = offset }, [offset])
  useEffect(() => { hoveredRef.current = hoveredNode }, [hoveredNode])
  useEffect(() => { selectedRef.current = selectedNode }, [selectedNode])
  useEffect(() => { searchRef.current = searchQuery }, [searchQuery])
  useEffect(() => { nodeSizeRef.current = nodeSize }, [nodeSize])
  useEffect(() => { linkDistRef.current = linkDistance }, [linkDistance])
  useEffect(() => { repelRef.current = repelForce }, [repelForce])
  useEffect(() => { isDraggingNodeRef.current = isDraggingNode }, [isDraggingNode])
  useEffect(() => { selectedTagRef.current = selectedTag }, [selectedTag])

  // 获取所有标签
  useEffect(() => {
    noteService.list().then((d) => {
      const tagMap = new Map<string, Set<string>>()
      const tagCount = new Map<string, number>()
      d.items.forEach((n) => {
        if (n.tags) {
          n.tags.split(",").filter(Boolean).forEach((t) => {
            if (!tagMap.has(t)) tagMap.set(t, new Set())
            tagMap.get(t)!.add(n.title)
            tagCount.set(t, (tagCount.get(t) || 0) + 1)
          })
        }
      })
      tagMapRef.current = tagMap
      setAllTags(Array.from(tagCount.entries()).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count))
    }).catch(() => {})
  }, [])

  // Load data
  useEffect(() => {
    noteService.graph().then((data) => {
      const rawLinks: GraphLink[] = (data.links || []).map((l: any) => ({
        source: String(l.source),
        target: String(l.target),
      }))
      // Compute degree for each node
      const degreeMap: Record<string, number> = {}
      rawLinks.forEach((l) => {
        degreeMap[l.source] = (degreeMap[l.source] || 0) + 1
        degreeMap[l.target] = (degreeMap[l.target] || 0) + 1
      })
      const nodes: GraphNode[] = (data.nodes || []).map((n: any) => ({
        id: String(n.id),
        title: n.title || String(n.id),
        val: n.val || 3,
        is_auto_created: n.is_auto_created || false,
        has_content: n.has_content !== false,
        x: 0, y: 0, vx: 0, vy: 0,
        degree: degreeMap[String(n.id)] || 0,
      }))
      setGraphData({ nodes, links: rawLinks })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // d3-force style simulation
  const initSimulation = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const nodes = nodesRef.current
    if (nodes.length === 0) return

    const cx = w / 2
    const cy = h / 2
    const initRadius = Math.min(w, h) * 0.3
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2
      node.x = cx + initRadius * Math.cos(angle) + (Math.random() - 0.5) * 20
      node.y = cy + initRadius * Math.sin(angle) + (Math.random() - 0.5) * 20
      node.vx = 0
      node.vy = 0
    })

    tickCount.current = 0
    settledFrames.current = 0

    // Build neighbor map for hover highlighting
    const neighborMap: Record<string, Set<string>> = {}
    linksRef.current.forEach((l) => {
      if (!neighborMap[l.source]) neighborMap[l.source] = new Set()
      if (!neighborMap[l.target]) neighborMap[l.target] = new Set()
      neighborMap[l.source].add(l.target)
      neighborMap[l.target].add(l.source)
    })

    const tick = () => {
      tickCount.current++
      const linkDist = linkDistRef.current
      const repel = repelRef.current

      // Physics: run only if not settled or dragging a node
      const shouldRunPhysics = tickCount.current < 300 || isDraggingNodeRef.current
      if (!shouldRunPhysics) {
        let totalVel = 0
        nodes.forEach((n) => { totalVel += Math.abs(n.vx) + Math.abs(n.vy) })
        if (totalVel < 0.5) {
          settledFrames.current++
          if (settledFrames.current > 60) {
            render(ctx, w, h, neighborMap)
            rafRef.current = requestAnimationFrame(tick)
            return
          }
        }
      }

      // d3-force style: repulsion (forceManyBody), spring (forceLink), center (forceCenter)
      for (let iter = 0; iter < 2; iter++) {
        // Repulsion: strength = -30 * repel multiplier
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x
            const dy = nodes[j].y - nodes[i].y
            let dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 1) dist = 1
            const force = (300 * repel) / (dist * dist)
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            nodes[i].vx -= fx
            nodes[i].vy -= fy
            nodes[j].vx += fx
            nodes[j].vy += fy
          }
        }

        // Spring forces
        for (const link of linksRef.current) {
          const source = nodes.find((n) => n.id === link.source)
          const target = nodes.find((n) => n.id === link.target)
          if (!source || !target) continue
          const dx = target.x - source.x
          const dy = target.y - source.y
          let dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 1) dist = 1
          const force = (dist - linkDist) * 0.03
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          source.vx += fx
          source.vy += fy
          target.vx -= fx
          target.vy -= fy
        }

        // Center gravity + damping
        for (const node of nodes) {
          // If dragging this node, don't apply forces
          if (dragNodeRef.current?.id === node.id) {
            node.x = mousePosRef.current.x
            node.y = mousePosRef.current.y
            node.vx = 0
            node.vy = 0
            continue
          }
          node.vx += (cx - node.x) * 0.005
          node.vy += (cy - node.y) * 0.005
          node.vx *= 0.4 // velocityDecay
          node.vy *= 0.4
          node.x += node.vx
          node.y += node.vy
        }
      }

      render(ctx, w, h, neighborMap)
      rafRef.current = requestAnimationFrame(tick)
    }

    const render = (ctx: CanvasRenderingContext2D, w: number, h: number, neighborMap: Record<string, Set<string>>) => {
      // Clear with bg color
      ctx.fillStyle = COLORS.bg
      ctx.fillRect(0, 0, w, h)

      const z = zoomRef.current
      const ox = offsetRef.current.x
      const oy = offsetRef.current.y
      const hovered = hoveredRef.current
      const selected = selectedRef.current
      const search = searchRef.current.toLowerCase()

      // Determine focus set
      const focusNode = hovered || selected
      let focusSet: Set<string> | null = null
      if (focusNode) {
        focusSet = new Set([focusNode.id])
        const neighbors = neighborMap[focusNode.id]
        if (neighbors) neighbors.forEach((n) => focusSet!.add(n))
      }

      ctx.save()
      ctx.translate(ox, oy)
      ctx.scale(z, z)

      // Draw links
      for (const link of linksRef.current) {
        const source = nodes.find((n) => n.id === link.source)
        const target = nodes.find((n) => n.id === link.target)
        if (!source || !target) continue

        const isInFocus = !focusSet || (focusSet.has(source.id) && focusSet.has(target.id))
        const isHighlight = focusNode && (focusNode.id === source.id || focusNode.id === target.id)

        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        if (isHighlight) {
          ctx.strokeStyle = COLORS.lineHighlight
          ctx.lineWidth = 1.5 / z
        } else if (isInFocus) {
          ctx.strokeStyle = COLORS.line
          ctx.lineWidth = 1 / z
        } else {
          ctx.strokeStyle = "rgba(120, 120, 120, 0.08)"
          ctx.lineWidth = 0.5 / z
        }
        ctx.stroke()
      }

      // Draw nodes
      for (const node of nodes) {
        const baseR = (3 + node.degree * 1.2) * nodeSizeRef.current
        const isHovered = hovered?.id === node.id
        const isSelected = selected?.id === node.id
        const isMatched = search && node.title.toLowerCase().includes(search)
        const isInFocus = !focusSet || focusSet.has(node.id)

        // Node color
        let fillColor = COLORS.node
        if (node.is_auto_created) fillColor = COLORS.nodeUnresolved
        if (isHovered || isSelected) fillColor = COLORS.nodeFocused
        if (isMatched) fillColor = COLORS.nodeFocused

        // Tag filter — highlight nodes with selected tag
        const activeTag = selectedTagRef.current
        let hasTag = false
        if (activeTag) {
          hasTag = tagMapRef.current.get(activeTag)?.has(node.title) ?? false
          if (hasTag) fillColor = COLORS.nodeTag
        }

        const r = (isHovered || isSelected) ? baseR * 1.3 : baseR

        // Alpha for non-focused nodes
        let alpha = isInFocus ? 1 : 0.2
        if (activeTag && !hasTag) alpha = 0.1

        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = fillColor
        ctx.globalAlpha = alpha
        ctx.fill()

        // Selected ring
        if (isSelected) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 3 / z, 0, Math.PI * 2)
          ctx.strokeStyle = COLORS.nodeFocused
          ctx.lineWidth = 1.5 / z
          ctx.globalAlpha = 0.8
          ctx.stroke()
        }

        ctx.globalAlpha = 1

        // Label — text fade based on zoom
        const textAlpha = Math.max(0, Math.min(1, (z - 0.5) / 0.5)) * (isInFocus ? 1 : 0.2)
        if (textAlpha > 0.05) {
          ctx.fillStyle = (isHovered || isSelected || isMatched) ? COLORS.textBright : COLORS.text
          ctx.globalAlpha = textAlpha
          ctx.font = `${isHovered ? 12 : 11}px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif`
          ctx.textAlign = "center"
          ctx.fillText(node.title, node.x, node.y + r + 12 / z)
          ctx.globalAlpha = 1
        }
      }

      ctx.restore()
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Restart simulation when data or params change
  useEffect(() => {
    if (graphData.nodes.length > 0 && !loading) {
      nodesRef.current = graphData.nodes
      linksRef.current = graphData.links
      const cleanup = initSimulation()
      return cleanup
    }
  }, [graphData, loading, initSimulation, nodeSize, linkDistance, repelForce])

  // Mouse interactions
  const getMousePos = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (e.clientX - rect.left - offset.x) / zoom,
      y: (e.clientY - rect.top - offset.y) / zoom,
    }
  }

  const findNodeAt = (x: number, y: number) => {
    return nodesRef.current.find((n) => {
      const r = (3 + n.degree * 1.2) * nodeSizeRef.current + 4
      const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2)
      return dist < r
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e)
    mousePosRef.current = pos
    const node = findNodeAt(pos.x, pos.y)

    if (node) {
      setIsDraggingNode(true)
      dragNodeRef.current = node
      setSelectedNode(node)
    } else {
      setSelectedNode(null)
      setIsDragging(true)
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e)
    mousePosRef.current = pos

    if (isDraggingNode) {
      // Node drag — physics will handle it
      settledFrames.current = 0
      tickCount.current = 0
    } else if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    } else {
      const node = findNodeAt(pos.x, pos.y)
      setHoveredNode(node || null)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsDraggingNode(false)
    dragNodeRef.current = null
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((prev) => Math.max(0.2, Math.min(5, prev + delta)))
  }

  const handleNodeDoubleClick = () => {
    if (selectedNode) navigate(`/app/notes/${selectedNode.title}`)
  }

  const handleZoom = (delta: number) => setZoom((p) => Math.max(0.2, Math.min(5, p + delta)))
  const handleReset = () => { setZoom(1); setOffset({ x: 0, y: 0 }) }

  const totalNodes = graphData.nodes.length
  const totalLinks = graphData.links.length
  const contentNodes = graphData.nodes.filter((n) => !n.is_auto_created).length
  const maxDegree = Math.max(...graphData.nodes.map((n) => n.degree), 0)

  // 选中节点的邻居（本地图谱）
  const neighborNodes = selectedNode
    ? graphData.links
        .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
        .map((l) => (l.source === selectedNode.id ? l.target : l.source))
        .map((id) => graphData.nodes.find((n) => n.id === id))
        .filter((n): n is GraphNode => !!n)
        .slice(0, 12)
    : []

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-semibold text-ink-800 tracking-tight">记忆宫殿</h1>
          <p className="text-sm text-ink-400 font-sans">
            Obsidian Graph · {totalNodes} nodes · {totalLinks} links · max degree {maxDegree}
          </p>
        </div>

        {/* Search + Settings */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索笔记..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-paper-50 border border-[var(--border-light)] text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:border-ink-300 font-sans"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-paper-100">
                <X className="w-3.5 h-3.5 text-ink-400" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="w-9 h-9 rounded-xl border-[var(--border-light)]"
          >
            <Settings className="w-4 h-4 text-ink-600" />
          </Button>
        </div>
      </motion.div>

      {/* Graph + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Graph canvas — Obsidian dark theme */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-3"
        >
          <div className="rounded-xl overflow-hidden shadow-lg">
            {/* Canvas container — dark Obsidian bg */}
            <div
              ref={containerRef}
              className="relative w-full h-[600px] cursor-grab active:cursor-grabbing"
              style={{ background: COLORS.bg }}
              onWheel={handleWheel}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleNodeDoubleClick}
              />

              {/* Zoom controls — Obsidian style floating */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
                {[
                  { icon: ZoomIn, action: () => handleZoom(0.2) },
                  { icon: ZoomOut, action: () => handleZoom(-0.2) },
                  { icon: Maximize, action: handleReset },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    className="w-9 h-9 rounded-lg backdrop-blur-sm border flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{ background: "rgba(37,37,37,0.9)", borderColor: COLORS.border }}
                  >
                    <btn.icon className="w-4 h-4" style={{ color: COLORS.text }} />
                  </button>
                ))}
              </div>

              {/* Zoom indicator */}
              <div
                className="absolute top-4 left-4 px-2.5 py-1 rounded-lg backdrop-blur-sm text-[10px] font-sans tabular-nums"
                style={{ background: "rgba(37,37,37,0.9)", border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              >
                {Math.round(zoom * 100)}%
              </div>

              {/* Filter panel */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 right-4 p-4 rounded-lg backdrop-blur-sm space-y-3 w-56"
                  style={{ background: "rgba(37,37,37,0.95)", border: `1px solid ${COLORS.border}` }}
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textBright }}>
                    图谱设置
                  </h4>
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] flex justify-between mb-1" style={{ color: COLORS.text }}>
                        <span>节点大小</span><span className="tabular-nums">{nodeSize.toFixed(1)}x</span>
                      </label>
                      <input type="range" min="0.5" max="2" step="0.1" value={nodeSize}
                        onChange={(e) => setNodeSize(parseFloat(e.target.value))}
                        className="w-full accent-blue-400" />
                    </div>
                    <div>
                      <label className="text-[10px] flex justify-between mb-1" style={{ color: COLORS.text }}>
                        <span>连线距离</span><span className="tabular-nums">{linkDistance}px</span>
                      </label>
                      <input type="range" min="40" max="160" step="10" value={linkDistance}
                        onChange={(e) => setLinkDistance(parseInt(e.target.value))}
                        className="w-full accent-blue-400" />
                    </div>
                    <div>
                      <label className="text-[10px] flex justify-between mb-1" style={{ color: COLORS.text }}>
                        <span>排斥力</span><span className="tabular-nums">{repelForce.toFixed(1)}</span>
                      </label>
                      <input type="range" min="0.1" max="1.5" step="0.1" value={repelForce}
                        onChange={(e) => setRepelForce(parseFloat(e.target.value))}
                        className="w-full accent-blue-400" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Empty state */}
              {totalNodes === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <Network className="w-16 h-16" style={{ color: COLORS.nodeUnresolved }} strokeWidth={1.5} />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium font-sans" style={{ color: COLORS.textBright }}>还没有笔记关联</p>
                    <p className="text-xs font-sans" style={{ color: COLORS.text }}>创建笔记并使用 [[双链]] 语法建立关联</p>
                  </div>
                </div>
              )}

              {/* Hovered node tooltip */}
              {hoveredNode && !selectedNode && (
                <div
                  className="absolute pointer-events-none px-3 py-1.5 rounded-lg text-xs font-sans whitespace-nowrap shadow-lg"
                  style={{
                    left: `${hoveredNode.x * zoom + offset.x + 15}px`,
                    top: `${hoveredNode.y * zoom + offset.y - 30}px`,
                    background: "rgba(37,37,37,0.95)",
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textBright,
                  }}
                >
                  {hoveredNode.title}
                  <span className="ml-2 text-[10px] tabular-nums" style={{ color: COLORS.text }}>
                    {hoveredNode.degree} links
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Side panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {/* Selected node */}
          {selectedNode ? (
            <div className="rounded-xl border border-[var(--border-light)] bg-white shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-ink-800/8 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-ink-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink-800 font-sans">{selectedNode.title}</h3>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-0.5 rounded hover:bg-paper-100">
                  <X className="w-3.5 h-3.5 text-ink-400" />
                </button>
              </div>
              <div className="space-y-1.5 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">类型</span>
                  <span className="text-ink-700">{selectedNode.is_auto_created ? "占位笔记" : "内容笔记"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">关联数</span>
                  <span className="text-ink-700 tabular-nums">{selectedNode.degree}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-400">节点大小</span>
                  <span className="text-ink-700 tabular-nums">{((3 + selectedNode.degree * 1.2) * nodeSize).toFixed(1)}px</span>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/app/notes/${selectedNode.title}`)}
                className="w-full h-9 rounded-xl bg-ink-800 hover:bg-ink-900 text-white text-xs font-medium"
              >
                打开笔记
              </Button>
              {/* 本地图谱 — 邻居节点 */}
              {neighborNodes.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-light)]">
                  <p className="text-[10px] text-ink-400 uppercase tracking-widest mb-2 font-sans">关联节点 ({neighborNodes.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {neighborNodes.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        className="px-2 py-1 rounded text-[10px] font-sans transition-all bg-paper-100 hover:bg-amber/10 text-ink-600 hover:text-amber border border-transparent hover:border-amber/30"
                      >
                        {n.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-light)] bg-white shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-ink-500" />
                <h3 className="text-sm font-semibold text-ink-800 font-sans">图谱统计</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "总节点", value: totalNodes },
                  { label: "关联线", value: totalLinks },
                  { label: "内容笔记", value: contentNodes },
                  { label: "最大连接度", value: maxDegree },
                ].map((s) => (
                  <div key={s.label} className="space-y-0.5">
                    <p className="text-2xl font-display font-semibold text-ink-800 tabular-nums">{s.value}</p>
                    <p className="text-[10px] text-ink-400 uppercase tracking-widest font-sans">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend — Obsidian color scheme */}
          <div className="rounded-xl border border-[var(--border-light)] bg-white shadow-sm p-5 space-y-2.5">
            <h3 className="text-xs font-semibold text-ink-700 font-sans uppercase tracking-widest">图例</h3>
            <div className="space-y-2">
              {[
                { color: COLORS.node, label: "内容笔记" },
                { color: COLORS.nodeUnresolved, label: "占位笔记" },
                { color: COLORS.nodeFocused, label: "聚焦/匹配" },
                { color: COLORS.nodeTag, label: "标签筛选" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-ink-500 font-sans">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-[var(--border-light)]">
              <p className="text-[10px] text-ink-400 font-sans leading-relaxed">
                点击节点选中 · 拖拽节点重排 · 双击打开笔记 · 滚轮缩放 · 拖拽空白平移
              </p>
            </div>
          </div>

          {/* 标签面板 — Obsidian Tag Pane */}
          {allTags.length > 0 && (
            <div className="rounded-xl border border-[var(--border-light)] bg-white shadow-sm p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-ink-700 font-sans uppercase tracking-widest">标签</h3>
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-[10px] text-ink-400 hover:text-error transition-colors font-sans"
                  >
                    清除筛选
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                      selectedTag === tag
                        ? "bg-amber text-white border-amber"
                        : "bg-amber/10 text-amber hover:bg-amber/20 border-transparent"
                    } border`}
                  >
                    #{tag} <span className="opacity-60">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Usage hint */}
          <div className="rounded-xl border border-amber/20 bg-amber/5 shadow-sm p-4">
            <p className="text-xs text-ink-600 font-sans leading-relaxed">
              在笔记中使用 <code className="px-1 py-0.5 rounded bg-amber/10 text-amber font-mono text-[10px]">[[笔记标题]]</code> 语法创建双向链接
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
