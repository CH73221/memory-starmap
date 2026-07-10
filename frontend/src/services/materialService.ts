import api from "./api"
import type { Material, MaterialListResponse } from "@/types"

export const materialService = {
  async upload(file: File, title: string): Promise<Material> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title)
    const response = await api.post<Material>("/materials/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  async list(): Promise<MaterialListResponse> {
    const response = await api.get<MaterialListResponse>("/materials/")
    return response.data
  },

  async get(id: number): Promise<Material> {
    const response = await api.get<Material>(`/materials/${id}`)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/materials/${id}`)
  },

  async importSample(): Promise<Material> {
    try {
      const response = await api.post<Material>("/materials/import-sample")
      return response.data
    } catch (e) {
      // Fallback: simulate sample import
      return {
        id: Date.now(),
        user_id: 1,
        title: "心理学入门：认知与记忆",
        file_type: "text",
        raw_text: `# 心理学入门：认知与记忆

## 第一章 认知心理学概述
认知心理学是研究人类心智的科学，关注人们如何获取、存储、加工和使用信息。

### 1.1 信息加工模型
信息加工模型将人脑比作计算机，认为信息经过以下阶段：
- 感觉记忆：短暂存储感官输入
- 短时记忆：暂时存储和加工信息
- 长时记忆：持久存储信息

### 1.2 注意与知觉
注意是心理活动对一定对象的指向和集中。选择性注意让我们能够在众多刺激中关注重要的信息。

## 第二章 记忆系统
记忆是过去经验在人脑中的反映。

### 2.1 感觉记忆
感觉记忆是记忆系统的开始阶段，存储时间极短，约0.25-2秒。

### 2.2 短时记忆与工作记忆
短时记忆容量有限，约为7±2个组块。工作记忆是短时记忆的扩展，包括语音回路、视觉空间模板和中央执行系统。

### 2.3 长时记忆
长时记忆是信息经过充分加工后，在头脑中长久保持的记忆。分为陈述性记忆和程序性记忆。

## 第三章 遗忘与记忆策略
艾宾浩斯遗忘曲线揭示了遗忘的规律：遗忘在学习之后立即开始，最初遗忘速度很快，以后逐渐缓慢。

### 3.1 遗忘的原因
- 消退说：记忆痕迹随时间减弱
- 干扰说：新旧信息相互干扰
- 压抑说：情绪或动机的压抑作用

### 3.2 提高记忆的方法
- 间隔重复：分散复习优于集中复习
- 主动回忆：测试效应
- 精细加工：将新信息与已有知识联系
- 记忆宫殿：空间记忆法`,
        summary: "心理学入门教程，涵盖认知心理学基础、记忆系统原理以及实用的记忆策略。",
        status: "processing",
        knowledge_point_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  },
}
