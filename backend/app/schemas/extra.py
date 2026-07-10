from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


# ===== Mistake Schemas =====
class MistakeCreate(BaseModel):
    flashcard_id: int
    question: str
    user_answer: Optional[str] = None
    correct_answer: str
    diagnosis: Optional[str] = "memory_decay"
    ai_explanation: Optional[str] = None
    related_knowledge_ids: Optional[List[int]] = []


class MistakeResponse(BaseModel):
    id: int
    flashcard_id: int
    question: str
    user_answer: Optional[str] = None
    correct_answer: str
    diagnosis: str
    ai_explanation: Optional[str] = None
    related_knowledge_ids: Optional[str] = None
    resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None
    correct_count: int = 0

    class Config:
        from_attributes = True


class MistakeListResponse(BaseModel):
    items: List[MistakeResponse]
    total: int
    unresolved: int
    by_diagnosis: dict = {}


class MistakeReviewRequest(BaseModel):
    """错题复习提交结果"""
    correct: bool  # 是否答对


class MistakeReviewResponse(BaseModel):
    """错题复习结果响应"""
    mistake_id: int
    correct: bool
    correct_count: int
    resolved: bool
    resolved_at: Optional[datetime] = None


class MistakeStatsResponse(BaseModel):
    """错题统计响应"""
    total: int
    unresolved: int
    resolved: int
    by_diagnosis: dict = {}
    today_added: int
    today_resolved: int


class WeaknessRadarResponse(BaseModel):
    knowledge_ids: List[int]
    labels: List[str]
    counts: List[int]
    total_mistakes: int


# ===== Focus Session Schemas =====
class FocusSessionCreate(BaseModel):
    duration_minutes: int = 25
    ambient_sound: str = "none"
    completed: bool = False
    notes: Optional[str] = None


class FocusSessionResponse(BaseModel):
    id: int
    duration_minutes: int
    completed: bool
    ambient_sound: str
    xp_earned: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class FocusStatsResponse(BaseModel):
    today_minutes: int
    today_sessions: int
    week_minutes: int
    total_sessions: int
    longest_streak_days: int
    total_xp: int


# ===== Leaderboard Schemas =====
class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    avatar: str
    grade: str  # 大一/大二/...
    major: str  # 专业
    today_reviews: int
    week_reviews: int
    total_reviews: int
    streak: int
    is_you: bool = False


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    your_rank: int
    your_percentile: float
    period: str  # today / week / total
    period_label: str


# ===== Achievement Schemas =====
class AchievementResponse(BaseModel):
    """成就响应"""
    key: str
    name: str
    description: str
    icon: str
    rarity: str  # common / rare / epic / legendary
    unlocked: bool
    unlocked_at: Optional[datetime] = None
    progress: Optional[dict] = None


class AchievementListResponse(BaseModel):
    """成就列表响应"""
    items: List[AchievementResponse]
    total: int
    unlocked_count: int
