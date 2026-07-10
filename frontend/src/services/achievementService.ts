import api from "./api"
import type { Achievement, AchievementStats } from "@/types"

export const achievementService = {
  async list(): Promise<Achievement[]> {
    try {
      const response = await api.get<Achievement[]>("/achievements")
      return response.data
    } catch (e) {
      return []
    }
  },

  async getUnlockedAchievements(): Promise<Achievement[]> {
    try {
      const response = await api.get<Achievement[]>("/achievements/unlocked")
      return response.data
    } catch (e) {
      return []
    }
  },

  async getStats(): Promise<AchievementStats> {
    try {
      const response = await api.get<AchievementStats>("/achievements/stats")
      return response.data
    } catch (e) {
      return {
        total: 20,
        unlocked: 0,
        completion_rate: 0,
        by_rarity: {
          legendary: { total: 5, unlocked: 0 },
          epic: { total: 5, unlocked: 0 },
          rare: { total: 5, unlocked: 0 },
          common: { total: 5, unlocked: 0 },
        },
      }
    }
  },
}
