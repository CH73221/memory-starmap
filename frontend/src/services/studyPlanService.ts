import api from "./api"
import type { StudyPlan, StudyPlanCreate, StudyPlanUpdate } from "@/types"

export const studyPlanService = {
  async list(): Promise<StudyPlan[]> {
    const response = await api.get<StudyPlan[]>("/study-plans/")
    return response.data
  },

  async get(id: number): Promise<StudyPlan> {
    const response = await api.get<StudyPlan>(`/study-plans/${id}`)
    return response.data
  },

  async create(data: StudyPlanCreate): Promise<StudyPlan> {
    const response = await api.post<StudyPlan>("/study-plans/", data)
    return response.data
  },

  async update(id: number, data: StudyPlanUpdate): Promise<StudyPlan> {
    const response = await api.put<StudyPlan>(`/study-plans/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/study-plans/${id}`)
  },

  async checkIn(id: number, completedCount: number): Promise<void> {
    await api.post(`/study-plans/${id}/check-in`, null, {
      params: { completed_count: completedCount },
    })
  },

  async createFromTemplate(template: string): Promise<StudyPlan> {
    const response = await api.post<StudyPlan>("/study-plans/quick-templates", null, {
      params: { template },
    })
    return response.data
  },
}