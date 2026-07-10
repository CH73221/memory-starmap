from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class StudyPlanCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_type: str = "flashcards"
    target_material_id: Optional[int] = None
    target_count: int = 20
    daily_target: int = 10
    duration_days: int = 30
    start_date: date
    end_date: date
    icon: str = "📚"
    color: str = "indigo"


class StudyPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_count: Optional[int] = None
    daily_target: Optional[int] = None
    duration_days: Optional[int] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class StudyPlanProgressItem(BaseModel):
    id: int
    progress_date: date
    completed_count: int
    target_count: int
    is_completed: bool
    note: Optional[str] = None


class StudyPlanResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    target_type: str
    target_material_id: Optional[int] = None
    target_count: int
    daily_target: int
    duration_days: int
    start_date: date
    end_date: date
    status: str
    icon: str
    color: str
    completed_count: int = 0
    progress_percentage: float = 0
    today_progress: int = 0
    days_remaining: int = 0
    progress: list[StudyPlanProgressItem] = []
    predicted_completion_date: Optional[date] = None  # 基于历史日均进度预测完成日期
    daily_average: float = 0  # 过去 7 天日均完成数
    on_track: bool = False  # 是否按计划进行中
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True