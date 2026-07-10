import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { flashcardService } from "@/services/flashcardService"
import type { TodayCardsResponse } from "@/types"

export function useTodayCards() {
  return useQuery<TodayCardsResponse>({
    queryKey: ["flashcards", "today"],
    queryFn: () => flashcardService.getToday(),
  })
}

export function useReviewFlashcard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { flashcardId: number; quality: number; responseTimeMs?: number }) =>
      flashcardService.review(params.flashcardId, params.quality, params.responseTimeMs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards", "today"] })
      queryClient.invalidateQueries({ queryKey: ["stats", "overview"] })
    },
  })
}

export function useGenerateFlashcards(materialId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => flashcardService.generate(materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] })
      queryClient.invalidateQueries({ queryKey: ["materials", materialId] })
    },
  })
}
