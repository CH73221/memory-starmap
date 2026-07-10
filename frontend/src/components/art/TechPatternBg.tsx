/**
 * TechPatternBg — 纸墨色调科技图案背景
 * Canvas 绘制：流动电路线 + 脉冲节点 + 数据粒子
 * 保持纸色背景上的墨蓝色线条美学
 */

import { useEffect, useRef } from "react"

interface CircuitNode {
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

interface Particle {
  fromIdx: number
  toIdx: number
  progress: number
  speed: number
}

export function TechPatternBg({
  className = "",
  nodeCount = 28,
}: {
  className?: string
  nodeCount?: number
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let nodes: CircuitNode[] = []
    let particles: Particle[] = []

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
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          radius: 1.5 + Math.random() * 2,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.02,
          connections: [],
        })
      }

      // Connect to 2-3 nearest neighbors
      for (let i = 0; i < nodes.length; i++) {
        const dists: Array<{ idx: number; dist: number }> = []
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          dists.push({ idx: j, dist: dx * dx + dy * dy })
        }
        dists.sort((a, b) => a.dist - b.dist)
        nodes[i].connections = dists.slice(0, 2 + Math.floor(Math.random() * 2)).map((d) => d.idx)
      }

      particles = []
      for (let i = 0; i < 8; i++) spawnParticle()
    }

    const spawnParticle = () => {
      if (nodes.length === 0) return
      const fromIdx = Math.floor(Math.random() * nodes.length)
      const node = nodes[fromIdx]
      if (node.connections.length === 0) return
      const toIdx = node.connections[Math.floor(Math.random() * node.connections.length)]
      particles.push({
        fromIdx,
        toIdx,
        progress: 0,
        speed: 0.003 + Math.random() * 0.007,
      })
    }

    // 纸墨色调
    const inkColor = "26, 26, 46"       // --ink-800
    const inkLight = "107, 107, 141"    // --ink-400
    const amberColor = "200, 121, 65"   // --amber

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Update nodes
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy
        node.vx += (node.baseX - node.x) * 0.0008
        node.vy += (node.baseY - node.y) * 0.0008
        node.vx *= 0.99
        node.vy *= 0.99
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
        node.pulse += node.pulseSpeed
      }

      // Draw connections — 电路线风格
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        for (const connIdx of node.connections) {
          if (connIdx <= i) continue
          const target = nodes[connIdx]
          if (!target) continue
          const dx = target.x - node.x
          const dy = target.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 200) continue

          const alpha = (1 - dist / 200) * 0.08
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          ctx.lineTo(target.x, target.y)
          ctx.strokeStyle = `rgba(${inkColor}, ${alpha})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // Draw particles — 琥珀色数据流
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

        // Trail
        const trailLen = 0.12
        const trailStart = Math.max(0, p.progress - trailLen)
        const tx = from.x + (to.x - from.x) * trailStart
        const ty = from.y + (to.y - from.y) * trailStart
        const grad = ctx.createLinearGradient(tx, ty, px, py)
        grad.addColorStop(0, `rgba(${amberColor}, 0)`)
        grad.addColorStop(1, `rgba(${amberColor}, 0.5)`)
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(px, py)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1
        ctx.stroke()

        // Dot
        ctx.beginPath()
        ctx.arc(px, py, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${amberColor}, 0.7)`
        ctx.fill()
      }

      // Draw nodes — 脉冲点
      for (const node of nodes) {
        const pulseVal = (Math.sin(node.pulse) * 0.5 + 0.5)
        const r = node.radius + pulseVal * 1

        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${inkLight}, ${0.15 + pulseVal * 0.15})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(render)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    rafRef.current = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [nodeCount])

  return <canvas ref={canvasRef} className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true" />
}
