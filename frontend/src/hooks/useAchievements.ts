import { useState, useEffect, useCallback, useRef } from "react"
import type { Achievement, AchievementStats, AchievementRarity } from "@/types"
import { statsService } from "@/services/statsService"

// Mock achievement data for demo
const MOCK_ACHIEVEMENTS: Achievement[] = [
  // Common
  { id: 1, name: "初学者", description: "完成第一次复习", icon: "sparkles", rarity: "common", category: "review", unlocked: false, xp_reward: 50, progress: 0, progress_target: 1 },
  { id: 2, name: "知识探索者", description: "掌握 10 个知识点", icon: "brain", rarity: "common", category: "knowledge", unlocked: false, xp_reward: 80, progress: 0, progress_target: 10 },
  { id: 3, name: "复习新手", description: "完成 50 次复习", icon: "target", rarity: "common", category: "review", unlocked: false, xp_reward: 100, progress: 0, progress_target: 50 },
  { id: 4, name: "第一份资料", description: "上传第一份学习资料", icon: "book", rarity: "common", category: "material", unlocked: false, xp_reward: 30, progress: 0, progress_target: 1 },
  { id: 5, name: "笔记达人", description: "创建 10 篇笔记", icon: "book", rarity: "common", category: "notes", unlocked: false, xp_reward: 60, progress: 0, progress_target: 10 },

  // Rare
  { id: 6, name: "七日达人", description: "连续学习 7 天", icon: "flame", rarity: "rare", category: "streak", unlocked: false, xp_reward: 200, progress: 0, progress_target: 7 },
  { id: 7, name: "饱学之士", description: "掌握 50 个知识点", icon: "award", rarity: "rare", category: "knowledge", unlocked: false, xp_reward: 250, progress: 0, progress_target: 50 },
  { id: 8, name: "闪卡收藏家", description: "拥有 100 张闪卡", icon: "medal", rarity: "rare", category: "flashcard", unlocked: false, xp_reward: 150, progress: 0, progress_target: 100 },
  { id: 9, name: "专注新星", description: "完成 10 次专注学习", icon: "target", rarity: "rare", category: "focus", unlocked: false, xp_reward: 120, progress: 0, progress_target: 10 },
  { id: 10, name: "资料收藏家", description: "上传 5 份学习资料", icon: "book", rarity: "rare", category: "material", unlocked: false, xp_reward: 180, progress: 0, progress_target: 5 },

  // Epic
  { id: 11, name: "月度学者", description: "连续学习 30 天", icon: "trophy", rarity: "epic", category: "streak", unlocked: false, xp_reward: 500, progress: 0, progress_target: 30 },
  { id: 12, name: "复习达人", description: "完成 500 次复习", icon: "zap", rarity: "epic", category: "review", unlocked: false, xp_reward: 400, progress: 0, progress_target: 500 },
  { id: 13, name: "知识架构师", description: "掌握 100 个知识点", icon: "star", rarity: "epic", category: "knowledge", unlocked: false, xp_reward: 600, progress: 0, progress_target: 100 },
  { id: 14, name: "记忆大师", description: "完成 200 张闪卡复习", icon: "brain", rarity: "epic", category: "flashcard", unlocked: false, xp_reward: 350, progress: 0, progress_target: 200 },
  { id: 15, name: "专注专家", description: "累计专注 10 小时", icon: "clock", rarity: "epic", category: "focus", unlocked: false, xp_reward: 300, progress: 0, progress_target: 600 },

  // Legendary
  { id: 16, name: "百日宗师", description: "连续学习 100 天", icon: "crown", rarity: "legendary", category: "streak", unlocked: false, xp_reward: 1000, progress: 0, progress_target: 100 },
  { id: 17, name: "百科全书", description: "掌握 500 个知识点", icon: "gem", rarity: "legendary", category: "knowledge", unlocked: false, xp_reward: 1500, progress: 0, progress_target: 500 },
  { id: 18, name: "复习宗师", description: "完成 2000 次复习", icon: "rocket", rarity: "legendary", category: "review", unlocked: false, xp_reward: 1200, progress: 0, progress_target: 2000 },
  { id: 19, name: "传奇学者", description: "获得 10000 XP", icon: "shield", rarity: "legendary", category: "xp", unlocked: false, xp_reward: 2000, progress: 0, progress_target: 10000 },
  { id: 20, name: "全知之眼", description: "解锁所有成就", icon: "star", rarity: "legendary", category: "meta", unlocked: false, xp_reward: 3000, progress: 0, progress_target: 19 },
]

function computeStats(achievements: Achievement[]): AchievementStats {
  const by_rarity: Record<AchievementRarity, { total: number; unlocked: number }> = {
    legendary: { total: 0, unlocked: 0 },
    epic: { total: 0, unlocked: 0 },
    rare: { total: 0, unlocked: 0 },
    common: { total: 0, unlocked: 0 },
  }

  achievements.forEach(a => {
    by_rarity[a.rarity].total += 1
    if (a.unlocked) by_rarity[a.rarity].unlocked += 1
  })

  const unlocked = achievements.filter(a => a.unlocked).length
  return {
    total: achievements.length,
    unlocked,
    completion_rate: achievements.length > 0 ? (unlocked / achievements.length) * 100 : 0,
    by_rarity,
  }
}

// Local storage key for achievement state
const ACHIEVEMENT_STORAGE_KEY = "memory_starmap_achievements"
const UNLOCKED_QUEUE_KEY = "memory_starmap_unlocked_queue"

function loadAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) { /* ignore */ }
  return MOCK_ACHIEVEMENTS.map(a => ({ ...a }))
}

function saveAchievements(achievements: Achievement[]) {
  try {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(achievements))
  } catch (e) { /* ignore */ }
}

function getUnlockedQueue(): number[] {
  try {
    const stored = localStorage.getItem(UNLOCKED_QUEUE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (e) { /* ignore */ }
  return []
}

function setUnlockedQueue(queue: number[]) {
  try {
    localStorage.setItem(UNLOCKED_QUEUE_KEY, JSON.stringify(queue))
  } catch (e) { /* ignore */ }
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Try to fetch from API, fall back to local storage
      let data: Achievement[]
      try {
        const resp = await statsService.getAchievements()
        data = resp
      } catch {
        data = loadAchievements()
      }
      setAchievements(data)
      setStats(computeStats(data))
    } catch (err) {
      console.error("Failed to load achievements:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const refresh = useCallback(() => {
    loadData()
  }, [loadData])

  return { achievements, stats, loading, refresh }
}

export function useAchievementToast() {
  const [pendingAchievement, setPendingAchievement] = useState<Achievement | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const processedRef = useRef<Set<number>>(new Set())

  // Check for newly unlocked achievements periodically
  useEffect(() => {
    const checkForNewUnlocks = async () => {
      try {
        const queue = getUnlockedQueue()
        const achievements = loadAchievements()

        for (const id of queue) {
          if (processedRef.current.has(id)) continue
          const achievement = achievements.find(a => a.id === id && a.unlocked)
          if (achievement) {
            processedRef.current.add(id)
            setPendingAchievement(achievement)
            setModalOpen(true)
            // Remove from queue after showing
            const newQueue = queue.filter(qid => qid !== id)
            setUnlockedQueue(newQueue)
            break // Show one at a time
          }
        }
      } catch (e) { /* ignore */ }
    }

    // Initial check
    checkForNewUnlocks()

    // Poll every 10 seconds
    const interval = setInterval(checkForNewUnlocks, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleClose = useCallback(() => {
    setModalOpen(false)
    setTimeout(() => {
      setPendingAchievement(null)
      // Check if there are more in queue
      const queue = getUnlockedQueue()
      if (queue.length > 0) {
        const achievements = loadAchievements()
        const nextId = queue[0]
        const next = achievements.find(a => a.id === nextId && a.unlocked)
        if (next) {
          processedRef.current.add(nextId)
          setPendingAchievement(next)
          setModalOpen(true)
          const newQueue = queue.filter(qid => qid !== nextId)
          setUnlockedQueue(newQueue)
        }
      }
    }, 300)
  }, [])

  return {
    achievement: pendingAchievement,
    open: modalOpen,
    onClose: handleClose,
  }
}

// Helper function to unlock an achievement (called from other parts of the app)
export function unlockAchievement(id: number) {
  const achievements = loadAchievements()
  const achievement = achievements.find(a => a.id === id)
  if (!achievement || achievement.unlocked) return

  achievement.unlocked = true
  achievement.unlocked_at = new Date().toISOString()
  achievement.progress = achievement.progress_target || achievement.progress || 0

  saveAchievements(achievements)

  // Add to unlock queue for toast display
  const queue = getUnlockedQueue()
  if (!queue.includes(id)) {
    queue.push(id)
    setUnlockedQueue(queue)
  }
}

// Helper to update achievement progress
export function updateAchievementProgress(id: number, progress: number) {
  const achievements = loadAchievements()
  const achievement = achievements.find(a => a.id === id)
  if (!achievement || achievement.unlocked) return

  achievement.progress = progress
  if (achievement.progress_target && progress >= achievement.progress_target) {
    achievement.unlocked = true
    achievement.unlocked_at = new Date().toISOString()

    const queue = getUnlockedQueue()
    if (!queue.includes(id)) {
      queue.push(id)
      setUnlockedQueue(queue)
    }
  }

  saveAchievements(achievements)
}
