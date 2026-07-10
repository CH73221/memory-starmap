from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MaterialCreate(BaseModel):
    title: str
    file_type: str


class MaterialResponse(BaseModel):
    id: int
    user_id: int
    title: str
    file_type: str
    status: str
    summary: Optional[str] = None
    knowledge_point_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MaterialListResponse(BaseModel):
    items: list[MaterialResponse]
    total: int
