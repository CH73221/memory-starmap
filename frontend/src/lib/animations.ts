/**
 * Animation presets and utilities for GSAP + Framer Motion
 * Centralizes all animation configurations for consistency
 */

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

// ===== GSAP Presets =====

/** Staggered fade-up entrance for grids/lists */
export const gsapStaggerIn = (container: HTMLElement, items: string, delay = 0) => {
  const els = container.querySelectorAll(items)
  if (!els.length) return
  gsap.fromTo(
    els,
    { y: 24, opacity: 0, filter: "blur(4px)" },
    {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.6,
      stagger: 0.08,
      delay,
      ease: "power3.out",
    }
  )
}

/** Scroll-triggered reveal */
export const gsapScrollReveal = (el: HTMLElement, options?: gsap.TweenVars) => {
  gsap.fromTo(
    el,
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
      ...options,
    }
  )
}

/** Number count-up animation */
export const gsapCountUp = (
  el: HTMLElement,
  end: number,
  options?: { duration?: number; decimals?: number; prefix?: string; suffix?: string }
) => {
  const { duration = 1.5, decimals = 0, prefix = "", suffix = "" } = options || {}
  const obj = { val: 0 }
  gsap.to(obj, {
    val: end,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = prefix + obj.val.toFixed(decimals) + suffix
    },
  })
}

// ===== Framer Motion Variants =====

export const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
}

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
}

export const staggerContainer = (stagger = 0.06, delayChildren = 0) => ({
  initial: {},
  animate: {
    transition: { staggerChildren: stagger, delayChildren },
  },
})

export const staggerItem = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
}

// ===== Spring configs =====
export const springSoft = { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 }
export const springSnappy = { type: "spring" as const, stiffness: 600, damping: 25 }
export const springBouncy = { type: "spring" as const, stiffness: 300, damping: 18 }
