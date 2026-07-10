/**
 * NeuralNetworkBg — AI 科技感神经网络背景
 * Canvas 绘制的动态神经网络：节点脉冲 + 数据流连线 + 全息扫描线
 */

import { useEffect, useRef } from "react"

interface NeuralNode {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  radius: number
  pulse: number
  pulseSpeed: number
  connections: number[]
}

interface DataParticle {
  fromIdx: number
  toIdx: number
  progress: number
  speed: number
  color: string
}

export function NeuralNetworkBg({
  className = "",
  nodeCount = 35,
  color = "#6366f1",
  color2 = "#a855f7",
  color3 = "#ec4899",
}: {
  className?: string
  nodeCount?: number
  color?: string
  color2?: string
  color3?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let nodes: NeuralNode[] = []
    let particles: DataParticle[] = []
    let scanLineY = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initNodes()
    }

    const initNodes = () => {
      nodes = []
      for (let i = 0; i < nodeCount; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        nodes.push({
          x, y, baseX: x, baseY: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: 2 + Math.random() * 3,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.03,
          connections: [],
        })
      }

      // Build connections — each node connects to 2-4 nearest neighbors
      for (let i = 0; i < nodes.length; i++) {
        const dists: Array<{ idx: number; dist: number }> = []
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          dists.push({ idx: j, dist: dx * dx + dy * dy })
        }
        dists.sort((a, b) => a.dist - b.dist)
        const numConn = 2 + Math.floor(Math.random() * 3)
        nodes[i].connections = dists.slice(0, numConn).map((d) => d.idx)
      }

      // Spawn data particles
      particles = []
      for (let i = 0; i < 12; i++) {
        spawnParticle()
      }
    }

    const spawnParticle = () => {
      if (nodes.length === 0) return
      const fromIdx = Math.floor(Math.random() * nodes.length)
      const node = nodes[fromIdx]
      if (node.connections.length === 0) return
      const toIdx = node.connections[Math.floor(Math.random() * node.connections.length)]
      const colors = [color, color2, color3]
      particles.push({
        fromIdx,
        toIdx,
        progress: 0,
        speed: 0.005 + Math.random() * 0.01,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    const hexToRgb = (hex: string): [number, number, number] => {
      const v = hex.replace("#", "")
      const n = parseInt(v, 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    const rgb1 = hexToRgb(color)
    const rgb2 = hexToRgb(color2)
    const rgb3 = hexToRgb(color3)

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height)

      // Update nodes
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy
        node.vx += (node.baseX - node.x) * 0.001
        node.vy += (node.baseY - node.y) * 0.001
        node.vx *= 0.99
        node.vy *= 0.99
        // Keep in bounds
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
        node.pulse += node.pulseSpeed
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        for (const connIdx of node.connections) {
          if (connIdx <= i) continue // avoid double-draw
          const target = nodes[connIdx]
          if (!target) continue
          const dx = target.x - node.x
          const dy = target.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 250) continue

          const alpha = (1 - dist / 250) * 0.15
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(target.x, target.y)
          ctx.strokeStyle = `rgba(${rgb1[0]},${rgb1[1]},${rgb1[2]},${alpha})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // Update and draw data particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.progress += p.speed
        if (p.progress >= 1) {
          particles.splice(i, 1)
          spawnParticle()
          continue
        }
        const from = nodes[p.fromIdx]
        const to = nodes[p.toIdx]
        if (!from || !to) {
          particles.splice(i, 1)
          continue
        }
        const px = from.x + (to.x - from.x) * p.progress
        const py = from.y + (to.y - from.y) * p.progress
        const prgb = hexToRgb(p.color)

        // Glow trail
        const trailLen = 0.15
        const trailStart = Math.max(0, p.progress - trailLen)
        const tx = from.x + (to.x - from.x) * trailStart
        const ty = from.y + (to.y - from.y) * trailStart
        const grad = ctx.createLinearGradient(tx, ty, px, py)
        grad.addColorStop(0, `rgba(${prgb[0]},${prgb[1]},${prgb[2]},0)`)
        grad.addColorStop(1, `rgba(${prgb[0]},${prgb[1]},${prgb[2]},0.8)`)
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(px, py)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Particle dot
        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${prgb[0]},${prgb[1]},${prgb[2]},0.9)`
        ctx.fill()
      }

      // Draw nodes
      for (const node of nodes) {
        const pulseVal = (Math.sin(node.pulse) * 0.5 + 0.5)
        const r = node.radius + pulseVal * 2

        // Outer glow
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 4)
        const colorIdx = Math.floor(node.pulse / 2) % 3
        const c = colorIdx === 0 ? rgb1 : colorIdx === 1 ? rgb2 : rgb3
        grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.3 + pulseVal * 0.2})`)
        grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`)
        ctx.beginPath()
        ctx.arc(node.x, node.y, r * 4, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.6 + pulseVal * 0.3})`
        ctx.fill()
      }

      // Scan line — holographic effect
      scanLineY += 1.5
      if (scanLineY > height + 100) scanLineY = -100
      const scanGrad = ctx.createLinearGradient(0, scanLineY - 80, 0, scanLineY + 80)
      scanGrad.addColorStop(0, "rgba(99, 102, 241, 0)")
      scanGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.06)")
      scanGrad.addColorStop(1, "rgba(99, 102, 241, 0)")
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanLineY - 80, width, 160)

      // Bright scan line
      ctx.beginPath()
      ctx.moveTo(0, scanLineY)
      ctx.lineTo(width, scanLineY)
      ctx.strokeStyle = "rgba(168, 85, 247, 0.15)"
      ctx.lineWidth = 1
      ctx.stroke()

      rafRef.current = requestAnimationFrame(render)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    rafRef.current = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [nodeCount, color, color2, color3])

  return <canvas ref={canvasRef} className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true" />
}
