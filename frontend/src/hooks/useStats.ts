import { useQuery } from "@tanstack/react-query"
import { statsService } from "@/services/statsService"
import type { StatsOverview, HeatmapResponse, MasteryData, LearningAnalysis } from "@/types"

export function useOverview() {
  return useQuery<StatsOverview>({
    queryKey: ["stats", "overview"],
    queryFn: () => statsService.getOverview(),
  })
}

export function useHeatmap() {
  return useQuery<HeatmapResponse>({
    queryKey: ["stats", "heatmap"],
    queryFn: () => statsService.getHeatmap(),
  })
}

export function useMastery() {
  return useQuery<MasteryData[]>({
    queryKey: ["stats", "mastery"],
    queryFn: () => statsService.getMastery(),
  })
}

export function useLearningAnalysis(type: string, enabled = true) {
  return useQuery<LearningAnalysis>({
    queryKey: ["stats", "learningAnalysis", type],
    queryFn: () => statsService.getLearningAnalysis(type),
    enabled,
  })
}
