from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class KnowledgePointResponse(BaseModel):
    id: int
    title: str
    content: str
    importance: int
    mastery_level: float
    material_id: Optional[int] = None

    class Config:
        from_attributes = True


class KnowledgeRelationResponse(BaseModel):
    id: int
    source_id: int
    target_id: int
    relation_type: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class GraphNode(BaseModel):
    id: int
    name: str
    val: int
    color: str
    mastery_level: float
    content: Optional[str] = None


class GraphLink(BaseModel):
    source: int
    target: int
    label: str
    description: Optional[str] = None


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    links: list[GraphLink]


# 改进 7：新增知识点更新 schema，用于类型校验和部分更新
class KnowledgePointUpdate(BaseModel):
    """知识点部分更新 schema，所有字段均为可选。

    用于 PATCH/PUT 请求中只更新传入的字段，
    替代原先使用 dict + 手动检查 key 的方式。
    """
    title: Optional[str] = None
    content: Optional[str] = None
    importance: Optional[int] = None


class KnowledgePointDetail(BaseModel):
    """知识点详情：包含闪卡数量、掌握度、关系数量等完整信息。"""
    id: int
    title: str
    content: str
    importance: int
    mastery_level: float
    material_id: Optional[int] = None
    review_count: int = 0
    flashcard_count: int = 0
    relation_count: int = 0
    last_reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class KnowledgeRelationDetail(BaseModel):
    """关系详情：含关系类型和两端知识点详情。"""
    id: int
    source_id: int
    target_id: int
    relation_type: str
    description: Optional[str] = None
    source: Optional[KnowledgePointResponse] = None
    target: Optional[KnowledgePointResponse] = None

    class Config:
        from_attributes = True


class NeighborNode(BaseModel):
    """邻居节点信息 + 距离（跳数）。"""
    id: int
    title: str
    mastery_level: float
    relation_type: str  # 到达该节点的关系类型
    depth: int  # 距离（跳数）


class CreateRelationRequest(BaseModel):
    """创建关系的请求体。"""
    source_id: int
    target_id: int
    relation_type: str = "related"
    description: Optional[str] = None
