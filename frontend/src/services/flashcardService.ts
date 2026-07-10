import api from "./api"
import type { Flashcard, TodayCardsResponse } from "@/types"

export const flashcardService = {
  async generate(materialId: number): Promise<void> {
    await api.post(`/flashcards/generate/${materialId}`)
  },

  async list(): Promise<Flashcard[]> {
    const response = await api.get<Flashcard[]>("/flashcards/")
    return response.data
  },

  async getToday(): Promise<TodayCardsResponse> {
    const response = await api.get<TodayCardsResponse>("/flashcards/today")
    return response.data
  },

  async review(flashcardId: number, quality: number, responseTimeMs?: number): Promise<void> {
    await api.post(`/flashcards/${flashcardId}/review`, {
      quality,
      response_time_ms: responseTimeMs,
    })
  },
}
