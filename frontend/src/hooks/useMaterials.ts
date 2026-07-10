import { useQuery } from "@tanstack/react-query"
import { materialService } from "@/services/materialService"
import type { Material, MaterialListResponse } from "@/types"

export function useMaterials() {
  return useQuery<MaterialListResponse>({
    queryKey: ["materials"],
    queryFn: () => materialService.list(),
  })
}

export function useMaterial(id: number) {
  return useQuery<Material>({
    queryKey: ["materials", id],
    queryFn: () => materialService.get(id),
    enabled: !!id,
  })
}
