import { useQuery } from "@tanstack/react-query"
import { studyPlanService } from "@/services/studyPlanService"
import type { StudyPlan } from "@/types"

export function useStudyPlans() {
  return useQuery<StudyPlan[]>({
    queryKey: ["studyPlans"],
    queryFn: () => studyPlanService.list(),
  })
}

export function useStudyPlan(id: number) {
  return useQuery<StudyPlan>({
    queryKey: ["studyPlans", id],
    queryFn: () => studyPlanService.get(id),
    enabled: !!id,
  })
}
