import api from "./api"
import type { StatsOverview, ForgettingCurveData, MasteryData, HeatmapResponse, LearningAnalysis, TrendData, RadarData, Achievement, AchievementStats } from "@/types"

export const statsService = {
  async getOverview(): Promise<StatsOverview> {
    const response = await api.get<StatsOverview>("/stats/overview")
    return response.data
  },

  async getForgettingCurve(): Promise<ForgettingCurveData> {
    const response = await api.get<ForgettingCurveData>("/stats/forgetting-curve")
    return response.data
  },

  async getMastery(): Promise<MasteryData[]> {
    const response = await api.get<{ items: MasteryData[] }>("/stats/mastery")
    return response.data?.items || []
  },

  async getHeatmap(): Promise<HeatmapResponse> {
    const response = await api.get<HeatmapResponse>("/stats/heatmap")
    return response.data
  },

  async getLearningAnalysis(type: string): Promise<LearningAnalysis> {
    const response = await api.get<LearningAnalysis>("/stats/learning-analysis", {
      params: { type },
      timeout: 60000,
    })
    return response.data
  },

  async getTrend(days = 30): Promise<TrendData[]> {
    const response = await api.get<{ data: TrendData[] }>("/stats/trend", { params: { days } })
    return response.data?.data || []
  },

  async getRadar(): Promise<RadarData[]> {
    const response = await api.get<{ data: RadarData[] }>("/stats/radar")
    return response.data?.data || []
  },

  async getAchievements(): Promise<Achievement[]> {
    try {
      const response = await api.get<{ items: Achievement[] }>("/achievements")
      return response.data?.items || []
    } catch (e) {
      return []
    }
  },

  async getAchievementStats(): Promise<AchievementStats> {
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
