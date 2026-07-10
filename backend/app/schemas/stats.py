from pydantic import BaseModel
from typing import Optional


class StatsOverviewResponse(BaseModel):
    total_knowledge_points: int
    mastered_points: int
    total_flashcards: int
    today_review_count: int
    today_new_count: int
    study_streak: int
    total_reviews: int


class ForgettingCurvePoint(BaseModel):
    day: int  # 第几天
    retention_rate: float  # 记忆保留率 0-1
    sample_count: int = 0  # 样本数量（该天数有多少次复习）


class ForgettingCurveResponse(BaseModel):
    user_curve: list[ForgettingCurvePoint]  # 用户实际数据
    theoretical_curve: list[ForgettingCurvePoint]  # 理论自然遗忘
    optimal_curve: list[ForgettingCurvePoint]  # 最优间隔复习
    user_forget_rate: float  # 用户平均遗忘速率
    total_reviews_analyzed: int  # 分析的复习总数
    analysis_days: int  # 分析跨度（天）
    message: Optional[str] = None  # 数据不足时的提示信息


class MasteryItem(BaseModel):
    material_id: int
    material_title: str
    mastery_level: float
    total_points: int
    mastered_points: int


class MasteryResponse(BaseModel):
    items: list[MasteryItem]


class HeatmapDay(BaseModel):
    date: str
    count: int


class HeatmapResponse(BaseModel):
    data: list[HeatmapDay]



class AnalysisHighlight(BaseModel):
    icon: str
    text: str


class AnalysisRecommendation(BaseModel):
    title: str
    description: str


class LearningAnalysisResponse(BaseModel):
    type: str
    title: str
    content: str
    highlights: list[AnalysisHighlight] = []
    recommendations: list[AnalysisRecommendation] = []
