import api from "./api"
import type { GraphData, KnowledgePoint } from "@/types"

export const knowledgeService = {
  async getGraph(): Promise<GraphData> {
    const response = await api.get<GraphData>("/knowledge/graph")
    return response.data
  },

  async getPoints(materialId?: number): Promise<KnowledgePoint[]> {
    const params = materialId ? { material_id: materialId } : {}
    const response = await api.get<KnowledgePoint[]>("/knowledge/points", { params })
    return response.data
  },

  async getPoint(id: number): Promise<KnowledgePoint> {
    const response = await api.get<KnowledgePoint>(`/knowledge/points/${id}`)
    return response.data
  },

  async deletePoint(id: number): Promise<void> {
    await api.delete(`/knowledge/points/${id}`)
  },
}
