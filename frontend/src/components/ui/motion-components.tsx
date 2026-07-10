/**
 * Reusable motion components built on Framer Motion
 * Import these for consistent, premium animations across the app
 */

import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { cn } from "@/lib/utils"
import { staggerContainer, staggerItem } from "@/lib/animations"

// ===== MagneticButton: Magnetic hover effect for buttons =====
export function MagneticButton({
  children,
  className,
  strength = 0.3,
  ...props
}: {
  children: ReactNode
  className?: string
  strength?: number
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 500, damping: 28 })
  const springY = useSpring(y, { stiffness: 500, damping: 28 })

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * strength)
    y.set((e.clientY - centerY) * strength)
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileTap={{ scale: 0.95 }}
      className={cn("", className)}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
}

// ===== MotionCard: Spring hover lift for cards =====
export function MotionCard({
  children,
  className,
  lift = 6,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  lift?: number
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -lift, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className={cn("transition-shadow duration-300", className)}
    >
      {children}
    </motion.div>
  )
}

// ===== TextReveal: Staggered word-by-word text reveal =====
export function TextReveal({
  text,
  className,
  delay = 0,
  stagger = 0.04,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
}) {
  const words = text.split(" ")
  return (
    <motion.span
      className={cn("inline-block", className)}
      initial="initial"
      animate="animate"
      variants={staggerContainer(stagger, delay)}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            initial: { opacity: 0, y: 12, filter: "blur(4px)" },
            animate: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
            },
          }}
          className="inline-block"
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </motion.span>
  )
}

// ===== StaggerGrid: Staggered entrance for grid children =====
export function StaggerGrid({
  children,
  className,
  stagger = 0.06,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
}) {
  return (
    <motion.div
      className={cn("", className)}
      initial="initial"
      animate="animate"
      variants={staggerContainer(stagger, delay)}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div className={cn("", className)} variants={staggerItem}>
      {children}
    </motion.div>
  )
}

// ===== PageTransition: Wrapper for route-level page transitions =====
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ===== TiltCard: 3D tilt on hover =====
export function TiltCard({
  children,
  className,
  maxTilt = 8,
}: {
  children: ReactNode
  className?: string
  maxTilt?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(useMotionValue(0), { stiffness: 400, damping: 25 })
  const rotateY = useSpring(useMotionValue(0), { stiffness: 400, damping: 25 })

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotateY.set((px - 0.5) * maxTilt * 2)
    rotateX.set((0.5 - py) * maxTilt * 2)
  }

  const handleLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={cn("", className)}
    >
      {children}
    </motion.div>
  )
}

// ===== GlowOrb: Animated ambient glow blob =====
export function GlowOrb({
  className,
  color = "var(--amber)",
  size = 300,
}: {
  className?: string
  color?: string
  size?: number
}) {
  return (
    <motion.div
      className={cn("pointer-events-none absolute rounded-full opacity-[0.07] blur-3xl", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.05, 0.09, 0.05],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}
