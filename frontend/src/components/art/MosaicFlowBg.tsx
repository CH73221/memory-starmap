/**
 * 流动马赛克背景 — MiMo 风格全屏 Canvas
 * 大圆角方块网格 + 多层正弦噪声流 + 明显的色彩流动 + 高亮呼吸
 * 参考 Xiaomi MiMo 官网的马赛克动态背景效果
 *
 * 关键改进：
 * - 基础透明度大幅提升，效果明显可见
 * - 三色混合 + 高亮呼吸格子（部分格子有脉冲发光）
 * - 4 层正弦波 + 每格随机相位，形成有机流动感
 * - 支持 fullScreen 模式铺满整个容器
 */

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface MosaicFlowBgProps {
  className?: string
  tileSize?: number
  gap?: number
  radiusRatio?: number
  speed?: number
  /** 基础透明度 — MiMo 风格更高，让效果清晰可见 */
  baseOpacity?: number
  /** 波浪幅度 — 更大让效果更明显 */
  amplitude?: number
  /** 高亮格子概率 (0~1) — 部分格子会脉冲发光 */
  highlightRatio?: number
  color?: string
  color2?: string
  color3?: string
}

export function MosaicFlowBg({
  className,
  tileSize = 52,
  gap = 8,
  radiusRatio = 0.25,
  speed = 0.0004,
  baseOpacity = 0.08,
  amplitude = 0.22,
  highlightRatio = 0.06,
  color = "#1a1a2e",
  color2 = "#c87941",
  color3 = "#5b8c5a",
}: MosaicFlowBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let cols = 0
    let rows = 0
    let dpr = window.devicePixelRatio || 1
    let phaseOffsets: Float32Array = new Float32Array(0)
    let sizeOffsets: Float32Array = new Float32Array(0)
    let highlightFlags: Uint8Array = new Uint8Array(0)
    let highlightPhase: Float32Array = new Float32Array(0)

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      width = rect.width
      height = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = Math.ceil(width / (tileSize + gap)) + 1
      rows = Math.ceil(height / (tileSize + gap)) + 1

      const total = cols * rows
      phaseOffsets = new Float32Array(total)
      sizeOffsets = new Float32Array(total)
      highlightFlags = new Uint8Array(total)
      highlightPhase = new Float32Array(total)
      for (let i = 0; i < total; i++) {
        phaseOffsets[i] = Math.random() * Math.PI * 2
        sizeOffsets[i] = 0.8 + Math.random() * 0.4 // 0.8~1.2 大小微变化
        // 部分格子标记为高亮格 — 会脉冲发光
        if (Math.random() < highlightRatio) {
          highlightFlags[i] = 1
          highlightPhase[i] = Math.random() * Math.PI * 2
        }
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const hexToRgb = (hex: string): [number, number, number] => {
      const v = hex.replace("#", "")
      const n = parseInt(v.length === 3 ? v.split("").map((c) => c + c).join("") : v, 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    const rgb1 = hexToRgb(color)
    const rgb2 = hexToRgb(color2)
    const rgb3 = hexToRgb(color3)

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      const t = time * speed

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col
          const phase = phaseOffsets[idx]
          const sizeMul = sizeOffsets[idx]
          const isHighlight = highlightFlags[idx] === 1

          const nx = col * 0.10
          const ny = row * 0.10

          // 4 层正弦波 — 更丰富的噪声纹理
          const wave1 = Math.sin(nx + ny * 0.6 + t * 2.5 + phase)
          const wave2 = Math.sin(nx * 0.4 - ny * 1.0 + t * 1.8 + phase * 0.6)
          const wave3 = Math.sin((nx + ny) * 0.25 + t * 1.2 - phase * 0.4)
          const wave4 = Math.sin(nx * 0.8 + ny * 0.3 + t * 3.5 + phase * 1.3)

          // 归一化 0~1
          const noise = (wave1 + wave2 + wave3 + wave4) / 8 + 0.5

          // 透明度 — MiMo 风格更明显
          let alpha = baseOpacity + noise * amplitude

          // 边缘渐隐 — 只在角落渐隐，中间保持饱满
          const cx = cols / 2
          const cy = rows / 2
          const dist = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2)
          const maxDist = Math.sqrt(cx ** 2 + cy ** 2)
          const distFactor = 1 - Math.pow(dist / maxDist, 2) * 0.3
          alpha *= distFactor

          // 高亮格子 — 脉冲发光，透明度随时间波动
          if (isHighlight) {
            const pulse = Math.sin(time * 0.001 + highlightPhase[idx]) * 0.5 + 0.5
            alpha = baseOpacity + 0.15 + pulse * 0.25
          }

          if (alpha < 0.005) continue

          // 三色混合 — noise 值决定主色/琥珀/绿的权重
          const mix1 = 1 - noise * 0.5
          const mix2 = noise * 0.35
          const mix3 = noise * noise * 0.15
          const totalMix = mix1 + mix2 + mix3
          let r = Math.round((rgb1[0] * mix1 + rgb2[0] * mix2 + rgb3[0] * mix3) / totalMix)
          let g = Math.round((rgb1[1] * mix1 + rgb2[1] * mix2 + rgb3[1] * mix3) / totalMix)
          let b = Math.round((rgb1[2] * mix1 + rgb2[2] * mix2 + rgb3[2] * mix3) / totalMix)

          // 高亮格子用更亮的琥珀色
          if (isHighlight) {
            r = Math.round(r * 0.4 + rgb2[0] * 0.6)
            g = Math.round(g * 0.4 + rgb2[1] * 0.6)
            b = Math.round(b * 0.4 + rgb2[2] * 0.6)
          }

          // 位置 + 大小微变化
          const actualSize = tileSize * sizeMul
          const cellSize = tileSize + gap
          const x = col * cellSize + (tileSize - actualSize) / 2
          const y = row * cellSize + (tileSize - actualSize) / 2
          const radius = actualSize * radiusRatio

          // 高亮格子加发光
          if (isHighlight) {
            ctx.shadowColor = `rgba(${r},${g},${b},0.5)`
            ctx.shadowBlur = 12
          } else if (noise > 0.72) {
            ctx.shadowColor = `rgba(${r},${g},${b},0.2)`
            ctx.shadowBlur = 5
          } else {
            ctx.shadowBlur = 0
          }

          ctx.beginPath()
          ctx.roundRect(x, y, actualSize, actualSize, radius)
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
          ctx.fill()
        }
      }
      ctx.shadowBlur = 0
      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [tileSize, gap, radiusRatio, speed, baseOpacity, amplitude, highlightRatio, color, color2, color3])

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 pointer-events-none", className)}
      aria-hidden="true"
    />
  )
}
