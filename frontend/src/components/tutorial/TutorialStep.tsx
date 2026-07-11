import type { ReactNode } from "react"

/**
 * @deprecated 此组件已合并到 `Tutorial.tsx` 中。
 *
 * 电影感全屏引导现在由 `Tutorial.tsx` 内部的 `StepView` 直接渲染，
 * 不再使用独立的 `TutorialStep` 组件。该文件仅为向后兼容保留，
 * 渲染为 `null`，不会影响视觉表现。
 *
 * 如需修改单步展示，请编辑 `@/components/tutorial/Tutorial` 中的 `StepView`。
 */
interface TutorialStepProps {
  stepNumber?: number
  totalSteps?: number
  title?: string
  description?: string
  icon?: ReactNode
  visual?: ReactNode
  tips?: string[]
  gradient?: string
  onNext?: () => void
  onSkip?: () => void
  isLast?: boolean
}

export function TutorialStep(_: TutorialStepProps) {
  return null
}
