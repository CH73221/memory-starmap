from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NoteCreate(BaseModel):
    title: str
    content: str = ""


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    is_daily: bool
    is_auto_created: bool
    tags: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoteListItem(BaseModel):
    id: int
    title: str
    is_daily: bool
    is_auto_created: bool
    tags: str
    updated_at: datetime


class NoteListResponse(BaseModel):
    items: List[NoteListItem]
    total: int


class BacklinkItem(BaseModel):
    source_id: int
    source_title: str
    snippet: str
    updated_at: datetime


class NoteGraphNode(BaseModel):
    id: int
    title: str
    is_auto_created: bool
    val: int = 1  # 节点大小权重（连接数）


class NoteGraphLink(BaseModel):
    source: int  # source id
    target: int  # target id


class NotesGraphResponse(BaseModel):
    nodes: List[NoteGraphNode]
    links: List[NoteGraphLink]