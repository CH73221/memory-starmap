import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { knowledgeService } from "@/services/knowledgeService"
import type { GraphData, GraphNode } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FadeIn } from "@/components/ui/page-transition"
import { MemoryConstellationBg } from "@/components/art/MemoryConstellationBg"
import { cn, getMasteryLabel } from "@/lib/utils"
import {
  Search, ZoomIn, ZoomOut, RotateCcw, GitBranch, Brain, X, Layers,
  TrendingUp, Filter, Eye, EyeOff, ChevronRight,
} from "lucide-react"

// 晨雾纸页配色：掌握度从低到高
const PAPER_MASTERY_COLORS = [
  "#b85450", // 未掌握 - error/红
  "#c87941", // 较薄弱 - amber/琥珀
  "#6b6b8d", // 一般 - ink-400
  "#25253d", // 较熟悉 - ink-700
  "#1a1a2e", // 已掌握 - ink-800
]

function getPaperMasteryColor(level: number): string {
  if (level >= 0.8) return PAPER_MASTERY_COLORS[4]
  if (level >= 0.6) return PAPER_MASTERY_COLORS[3]
  if (level >= 0.4) return PAPER_MASTERY_COLORS[2]
  if (level >= 0.2) return PAPER_MASTERY_COLORS[1]
  return PAPER_MASTERY_COLORS[0]
}

// 主题分组颜色（克制的墨蓝/琥珀系）
const GROUP_COLORS = [
  "#1a1a2e", // ink-800
  "#c87941", // amber
  "#6b6b8d", // ink-400
  "#25253d", // ink-700
  "#5b8c5a", // success/绿
  "#b85450", // error/红
  "#353552", // ink-600
  "#d68f5a", // amber-500
]

export default function KnowledgeGraphPage() {
  const navigate = useNavigate()
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const nodesRef = useRef<any[]>([])
  const animRef = useRef<number>(0)

  const nodeGroups = useMemo(() => {
    if (!graphData) return new Map<number, number>()
    const groups = new Map<number, number>()
    const seen = new Map<string, number>()
    let next = 0
    graphData.nodes.forEach((n: any) => {
      const key = String(n.material_id ?? "unknown")
      if (!seen.has(key)) seen.set(key, next++)
      groups.set(n.id, seen.get(key)!)
    })
    return groups
  }, [graphData])

  const [filter, setFilter] = useState<"all" | "weak" | "strong">("all")

  const visibleNodeIds = useMemo(() => {
    if (!graphData || filter === "all") return new Set(graphData?.nodes.map(n => n.id) || [])
    const ids = new Set<number>()
    graphData.nodes.forEach(n => {
      if (filter === "weak" && n.mastery_level < 0.5) ids.add(n.id)
      if (filter === "strong" && n.mastery_level >= 0.8) ids.add(n.id)
    })
    return ids
  }, [graphData, filter])

  useEffect(() => { loadGraph() }, [])

  useEffect(() => {
    if (graphData && canvasRef.current) initSimulation()
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [graphData, visibleNodeIds])

  const loadGraph = async () => {
    try { const d = await knowledgeService.getGraph(); setGraphData(d) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const initSimulation = () => {
    if (!graphData || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    const w = rect.width, h = rect.height

    const nodes = graphData.nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / graphData.nodes.length
      const radius = Math.min(w, h) * 0.3
      return { ...n, x: w / 2 + radius * Math.cos(angle), y: h / 2 + radius * Math.sin(angle), vx: 0, vy: 0, baseR: 7 + n.val * 2.5 }
    })
    nodesRef.current = nodes

    const links = graphData.links.map(l => ({
      source: nodes.find(n => n.id === l.source),
      target: nodes.find(n => n.id === l.target),
      label: l.label,
    }))

    let tick = 0
    let settledFrames = 0
    let rafActive = true
    const simulate = () => {
      if (!rafActive) return
      tick++
      // 暖白纸背景
      ctx.fillStyle = "#fdfcfb"
      ctx.fillRect(0, 0, w, h)

      // 极淡的网格点（纸质纹理感）
      ctx.fillStyle = "rgba(201, 201, 218, 0.3)"
      for (let gx = 0; gx < w; gx += 30) {
        for (let gy = 0; gy < h; gy += 30) {
          ctx.beginPath()
          ctx.arc(gx, gy, 0.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.save()
      ctx.translate(offset.x, offset.y)
      ctx.scale(zoom, zoom)

      // Physics
      if (tick < 200) {
        for (let iter = 0; iter < 2; iter++) {
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y
              const dist = Math.sqrt(dx * dx + dy * dy) || 1
              const force = 5000 / (dist * dist)
              nodes[i].vx -= (dx / dist) * force; nodes[i].vy -= (dy / dist) * force
              nodes[j].vx += (dx / dist) * force; nodes[j].vy += (dy / dist) * force
            }
          }
          for (const link of links) {
            if (!link.source || !link.target) continue
            const dx = link.target.x - link.source.x, dy = link.target.y - link.source.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const force = (dist - 120) * 0.01
            link.source.vx += (dx / dist) * force; link.source.vy += (dy / dist) * force
            link.target.vx -= (dx / dist) * force; link.target.vy -= (dy / dist) * force
          }
          for (const node of nodes) {
            node.vx += (w / 2 - node.x) * 0.001; node.vy += (h / 2 - node.y) * 0.001
            node.vx *= 0.85; node.vy *= 0.85
            node.x += node.vx; node.y += node.vy
            node.x = Math.max(40, Math.min(w - 40, node.x))
            node.y = Math.max(40, Math.min(h - 40, node.y))
          }
        }
      }

      // Links - ink-200 细线
      for (const link of links) {
        if (!link.source || !link.target) continue
        if (!visibleNodeIds.has(link.source.id) || !visibleNodeIds.has(link.target.id)) continue
        ctx.beginPath()
        ctx.moveTo(link.source.x, link.source.y)
        ctx.lineTo(link.target.x, link.target.y)
        ctx.strokeStyle = "#c9c9da"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Nodes - 纯色填充 + 白边，无发光
      for (const node of nodes) {
        if (!visibleNodeIds.has(node.id)) continue
        const isSelected = selectedNode?.id === node.id
        const isHovered = hoveredNode?.id === node.id
        const matchesSearch = searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase())
        const scale = isHovered ? 1.2 : 1
        const r = node.baseR * scale

        const fillColor = getPaperMasteryColor(node.mastery_level)

        // 搜索匹配：琥珀色细边框环
        if (matchesSearch && !isSelected && !isHovered) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2)
          ctx.strokeStyle = "#c87941"
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // 选中：墨蓝粗边框环
        if (isSelected) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2)
          ctx.strokeStyle = "#1a1a2e"
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // 白边
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 1.5, 0, Math.PI * 2)
        ctx.fillStyle = "#ffffff"
        ctx.fill()

        // Node body - 纯色
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = fillColor
        ctx.fill()

        // Label text - 深色适配纸白背景
        const alpha = isHovered || matchesSearch ? 1 : 0.6
        ctx.fillStyle = `rgba(26, 26, 46, ${alpha})`
        ctx.font = `${isHovered || matchesSearch ? "600 " : "400 "}11px 'Outfit', -apple-system, sans-serif`
        ctx.textAlign = "center"
        ctx.fillText(node.name, node.x, node.y + r + 14)
      }

      ctx.restore()

      // Stop RAF after physics settles to save CPU/GPU
      if (tick > 200) {
        settledFrames++
        if (settledFrames > 30) {
          rafActive = false
          animRef.current = 0
          return // Stop the loop — canvas stays rendered with last frame
        }
      }
      animRef.current = requestAnimationFrame(simulate)
    }

    simulate()
  }

  const getCanvasCoords = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: (e.clientX - rect.left - offset.x) / zoom, y: (e.clientY - rect.top - offset.y) / zoom }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e)
    const clicked = nodesRef.current.find(n => visibleNodeIds.has(n.id) && Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 20)
    setSelectedNode(clicked || null)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (dragging) { setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); return }
    const { x, y } = getCanvasCoords(e)
    const hovered = nodesRef.current.find(n => visibleNodeIds.has(n.id) && Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < 20)
    setHoveredNode(hovered || null)
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleZoom = (delta: number) => setZoom(z => Math.max(0.3, Math.min(3, z + delta)))
  const resetView = () => { setZoom(1); setOffset({ x: 0, y: 0 }) }

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[500px] w-full rounded-xl" /></div>

  const groupsCount = new Set(nodeGroups.values()).size
  const totalNodes = graphData?.nodes.length || 0
  const weakCount = graphData?.nodes.filter(n => n.mastery_level < 0.5).length || 0
  const strongCount = graphData?.nodes.filter(n => n.mastery_level >= 0.8).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-ink-800">知识图谱</h1>
            <p className="text-ink-400 mt-1 flex items-center gap-3 flex-wrap text-sm">
              <span>{totalNodes} 个知识点</span>
              <span className="text-paper-300">·</span>
              <span>{groupsCount} 个学习主题</span>
              <span className="text-paper-300">·</span>
              <span className="text-error">{weakCount} 薄弱</span>
              <span className="text-paper-300">·</span>
              <span className="text-ink-700">{strongCount} 已掌握</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
              <Input
                placeholder="搜索节点..."
                className="pl-10 w-44"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-0.5 p-0.5 bg-paper-100 rounded-lg border border-gray-200">
              {[
                { key: "all", label: "全部", icon: Eye },
                { key: "weak", label: "薄弱", icon: TrendingUp },
                { key: "strong", label: "掌握", icon: Filter },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1",
                    filter === f.key
                      ? "bg-white text-ink-800 shadow-sm border border-gray-200"
                      : "text-ink-400 hover:text-ink-700"
                  )}
                >
                  <f.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="flex gap-4">
        {/* Canvas */}
        <FadeIn delay={100} className="flex-1">
          <Card className="overflow-hidden">
            <CardContent className="p-0 relative">
              {/* Top controls */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
                {[{ icon: ZoomIn, fn: () => handleZoom(0.2) }, { icon: ZoomOut, fn: () => handleZoom(-0.2) }, { icon: RotateCcw, fn: resetView }].map((btn, i) => (
                  <Button key={i} variant="outline" size="icon" className="h-8 w-8 bg-white border-gray-200 text-ink-600 hover:bg-ink-50 hover:text-ink-800 hover:border-ink-300 rounded-lg shadow-sm" onClick={btn.fn}>
                    <btn.icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>

              {/* Group legend */}
              {groupsCount > 0 && groupsCount <= 8 && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 max-w-[160px]">
                  {Array.from({ length: groupsCount }).map((_, i) => {
                    const groupNode = graphData?.nodes.find(n => nodeGroups.get(n.id) === i)
                    const title = groupNode ? (groupNode as any).material_title || "未分组" : ""
                    return (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-gray-200 shadow-sm text-[10px] font-medium text-ink-500">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GROUP_COLORS[i % GROUP_COLORS.length] }} />
                        <span className="truncate">{title}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {graphData && graphData.nodes.length > 0 ? (
                <canvas
                  ref={canvasRef}
                  className="w-full h-[560px] cursor-grab active:cursor-grabbing rounded-lg"
                  onClick={handleCanvasClick}
                  onMouseDown={e => { setDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }) }}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={() => setDragging(false)}
                  onMouseLeave={() => { setDragging(false); setHoveredNode(null) }}
                />
              ) : (
                <div className="h-[560px] flex items-center justify-center bg-paper-50 rounded-lg relative overflow-hidden">
                  <MemoryConstellationBg
                    traceCount={30}
                    forgetRate={0.003}
                    pulseInterval={500}
                    flowSpeed={0.3}
                    connectDist={130}
                    trailFade={16}
                    opacity={0.25}
                  />
                  <div className="text-center relative z-10">
                    <GitBranch className="w-16 h-16 mx-auto text-ink-300 mb-4 trace-drift" />
                    <h3 className="text-lg font-semibold text-ink-700 mb-2 font-display">暂无知识图谱</h3>
                    <p className="text-ink-400 text-sm">上传学习资料后，AI 会自动构建知识图谱</p>
                  </div>
                </div>
              )}

              {/* Hover tooltip - 白纸卡片 */}
              {hoveredNode && !dragging && (
                <div className="fixed z-50 pointer-events-none animate-fade-in" style={{ left: mousePos.x + 16, top: mousePos.y - 40 }}>
                  <div className="bg-white border border-gray-200 text-ink-800 text-xs font-medium px-3 py-2 rounded-lg shadow-md">
                    <p className="font-semibold">{hoveredNode.name}</p>
                    <p className="text-ink-400 text-[10px] mt-0.5">掌握度: {Math.round(hoveredNode.mastery_level * 100)}% · 重要度: {hoveredNode.val}/5</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Detail Panel - 白纸 */}
        {selectedNode && (
          <div className="w-80 shrink-0 animate-slide-in-right">
            <Card className="sticky top-24 shadow-md">
              <CardContent className="p-5 relative">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: getPaperMasteryColor(selectedNode.mastery_level) + "15" }}
                  >
                    <Brain className="w-5 h-5" style={{ color: getPaperMasteryColor(selectedNode.mastery_level) }} />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-ink-50 text-ink-400 hover:text-ink-800" onClick={() => setSelectedNode(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="text-base font-display font-bold text-ink-800 mb-2">{selectedNode.name}</h3>
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <Badge variant="outline" className="rounded-md text-[10px]">重要度: {selectedNode.val}/5</Badge>
                  <Badge
                    className="rounded-md text-[10px] border-0"
                    style={{
                      backgroundColor: getPaperMasteryColor(selectedNode.mastery_level) + "15",
                      color: getPaperMasteryColor(selectedNode.mastery_level),
                    }}
                  >
                    {getMasteryLabel(selectedNode.mastery_level)}
                  </Badge>
                </div>
                {selectedNode.content && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> 知识点内容
                    </h4>
                    <p className="text-xs text-ink-600 leading-relaxed">{selectedNode.content}</p>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-ink-400 text-xs">掌握程度</span>
                    <span className="font-bold text-sm" style={{ color: getPaperMasteryColor(selectedNode.mastery_level) }}>{Math.round(selectedNode.mastery_level * 100)}%</span>
                  </div>
                  <div className="h-2 bg-paper-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${selectedNode.mastery_level * 100}%`,
                        backgroundColor: getPaperMasteryColor(selectedNode.mastery_level),
                      }}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/app/review')}
                  className="w-full mt-4 rounded-lg bg-ink-800 hover:bg-ink-700 text-white shadow-sm hover:shadow-md transition-all"
                  size="sm"
                >
                  <Brain className="w-3.5 h-3.5 mr-1.5" /> 去复习相关闪卡
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Legend */}
      <FadeIn delay={200}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-6 text-xs flex-wrap">
              <span className="text-ink-400 font-medium">图例：</span>
              {[
                { c: PAPER_MASTERY_COLORS[0], l: "未掌握" },
                { c: PAPER_MASTERY_COLORS[1], l: "较薄弱" },
                { c: PAPER_MASTERY_COLORS[2], l: "一般" },
                { c: PAPER_MASTERY_COLORS[3], l: "较熟悉" },
                { c: PAPER_MASTERY_COLORS[4], l: "已掌握" },
              ].map(l => (
                <div key={l.l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: l.c }} /><span className="text-ink-500">{l.l}</span>
                </div>
              ))}
              <span className="text-paper-300">|</span>
              <span className="text-ink-400">圆圈颜色 = 掌握度</span>
              <span className="text-paper-300">·</span>
              <span className="text-ink-400">细线 = 知识关联</span>
              <span className="text-paper-300">·</span>
              <span className="text-ink-400">点击节点查看详情</span>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
