from pydantic import BaseModel
from typing import Optional


class FlashcardResponse(BaseModel):
    id: int
    question: str
    answer: str
    card_type: str
    difficulty: int
    knowledge_point_title: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewRequest(BaseModel):
    quality: int
    response_time_ms: Optional[int] = None
    combo: Optional[int] = 0  # 当前连击数，用于 XP 加成


class TodayCardsResponse(BaseModel):
    cards: list[FlashcardResponse]
    total: int
    new_count: int
    review_count: int
    from_plans: list[dict] = []  # 今日待复习卡片关联的学习计划列表
