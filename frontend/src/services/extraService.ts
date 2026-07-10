import api from "./api"
import type {
  Mistake,
  MistakeListResponse,
  WeaknessRadarResponse,
  MistakeReviewItem,
  MistakeReviewResult,
  MistakeStats,
  FocusSession,
  FocusStatsResponse,
  LeaderboardEntry,
  LeaderboardResponse,
} from "@/types"

// Re-export types so consumers can import them from this module
export type {
  Mistake,
  MistakeListResponse,
  WeaknessRadarResponse,
  MistakeReviewItem,
  MistakeReviewResult,
  MistakeStats,
  FocusSession,
  FocusStatsResponse,
  LeaderboardEntry,
  LeaderboardResponse,
}

export const mistakeService = {
  async list(includeResolved = false): Promise<MistakeListResponse> {
    const response = await api.get<MistakeListResponse>(`/mistakes${includeResolved ? "?include_resolved=true" : ""}`)
    return response.data
  },

  async create(data: { flashcard_id: number; question: string; user_answer?: string; correct_answer: string; related_knowledge_ids?: number[] }): Promise<Mistake> {
    const response = await api.post<Mistake>("/mistakes", data)
    return response.data
  },

  async resolve(id: number): Promise<void> {
    await api.post(`/mistakes/${id}/resolve`)
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/mistakes/${id}`)
  },

  async weaknessRadar(): Promise<WeaknessRadarResponse> {
    const response = await api.get<WeaknessRadarResponse>("/mistakes/weakness-radar")
    return response.data
  },

  async getReviewList(): Promise<MistakeReviewItem[]> {
    const response = await api.get<MistakeReviewItem[]>("/mistakes/review")
    return response.data
  },

  async reviewMistake(id: number, quality: number): Promise<MistakeReviewResult> {
    const response = await api.post<MistakeReviewResult>(`/mistakes/${id}/review`, { quality })
    return response.data
  },

  async getStats(): Promise<MistakeStats> {
    const response = await api.get<MistakeStats>("/mistakes/stats")
    return response.data
  },
}

export const focusService = {
  async create(data: { duration_minutes: number; ambient_sound: string; completed: boolean; xp_earned: number; notes?: string }): Promise<FocusSession> {
    const response = await api.post<FocusSession>("/focus/sessions", data)
    return response.data
  },

  async list(limit = 50): Promise<FocusSession[]> {
    const response = await api.get<FocusSession[]>(`/focus/sessions?limit=${limit}`)
    return response.data
  },

  async stats(): Promise<FocusStatsResponse> {
    const response = await api.get<FocusStatsResponse>("/focus/stats")
    return response.data
  },
}

export const leaderboardService = {
  async get(period: "today" | "week" | "total" = "today"): Promise<LeaderboardResponse> {
    const response = await api.get<LeaderboardResponse>(`/leaderboard?period=${period}`)
    return response.data
  },
}
