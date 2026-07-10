import api from "./api"
import type { NoteListItem, NoteResponse, BacklinkItem, NoteGraphNode, NoteGraphLink } from "@/types"

export const noteService = {
  async list(search = ""): Promise<{ items: NoteListItem[]; total: number }> {
    const response = await api.get<{ items: NoteListItem[]; total: number }>(`/notes${search ? `?search=${encodeURIComponent(search)}` : ""}`)
    return response.data
  },

  async create(data: { title: string; content?: string }): Promise<NoteResponse> {
    const response = await api.post<NoteResponse>("/notes", data)
    return response.data
  },

  async ensure(data: { title: string; content?: string }): Promise<NoteResponse> {
    const response = await api.post<NoteResponse>("/notes/ensure", data)
    return response.data
  },

  async getByTitle(title: string): Promise<NoteResponse> {
    const response = await api.get<NoteResponse>(`/notes/by-title/${encodeURIComponent(title)}`)
    return response.data
  },

  async get(id: number): Promise<NoteResponse> {
    const response = await api.get<NoteResponse>(`/notes/${id}`)
    return response.data
  },

  async update(id: number, data: { title?: string; content?: string }): Promise<NoteResponse> {
    const response = await api.put<NoteResponse>(`/notes/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/notes/${id}`)
  },

  async backlinks(id: number): Promise<BacklinkItem[]> {
    const response = await api.get<BacklinkItem[]>(`/notes/${id}/backlinks`)
    return response.data
  },

  async openDaily(): Promise<NoteResponse> {
    const response = await api.post<NoteResponse>("/notes/daily")
    return response.data
  },

  async graph(): Promise<{ nodes: NoteGraphNode[]; links: NoteGraphLink[] }> {
    const response = await api.get<{ nodes: NoteGraphNode[]; links: NoteGraphLink[] }>("/notes/graph/all")
    return response.data
  },
}
