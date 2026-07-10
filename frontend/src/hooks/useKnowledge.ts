import { useQuery } from "@tanstack/react-query"
import { knowledgeService } from "@/services/knowledgeService"
import type { GraphData, KnowledgePoint } from "@/types"

export function useGraph() {
  return useQuery<GraphData>({
    queryKey: ["knowledge", "graph"],
    queryFn: () => knowledgeService.getGraph(),
  })
}

export function usePoints(materialId?: number) {
  return useQuery<KnowledgePoint[]>({
    queryKey: ["knowledge", "points", materialId],
    queryFn: () => knowledgeService.getPoints(materialId),
  })
}
