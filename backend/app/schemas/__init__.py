# -*- coding: utf-8 -*-
"""
schemas/__init__.py - 统一导出所有 schema 类（改进 19）

从各子模块 re-export 主要的 schema 类，方便外部通过 `from app.schemas import X` 统一导入，
避免在业务代码中散落大量 `from app.schemas.xxx import Xxx` 的零散导入语句。
"""

# ===== auth（用户认证相关）=====
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
)

# ===== material（学习材料相关）=====
from app.schemas.material import (
    MaterialCreate,
    MaterialResponse,
    MaterialListResponse,
)

# ===== knowledge（知识点相关）=====
from app.schemas.knowledge import (
    KnowledgePointResponse,
    KnowledgeRelationResponse,
    GraphResponse,
    KnowledgePointUpdate,  # 改进 7：新增的知识点更新 schema
)

# ===== flashcard（闪卡相关）=====
from app.schemas.flashcard import (
    FlashcardResponse,
    ReviewRequest,
    TodayCardsResponse,
)

# ===== study_plan（学习计划相关）=====
from app.schemas.study_plan import (
    StudyPlanCreate,
    StudyPlanUpdate,
    StudyPlanResponse,
    StudyPlanProgressItem,
)

# ===== note（笔记相关）=====
from app.schemas.note import (
    NoteCreate,
    NoteUpdate,
    NoteResponse,
    BacklinkItem,
    NotesGraphResponse,
)

# ===== extra（错题本、专注、排行榜等扩展功能）=====
from app.schemas.extra import (
    MistakeCreate,
    MistakeResponse,
    MistakeListResponse,
    WeaknessRadarResponse,
    FocusSessionCreate,
    FocusSessionResponse,
    FocusStatsResponse,
    LeaderboardEntry,
    LeaderboardResponse,
)

# ===== stats（统计分析相关）=====
from app.schemas.stats import (
    StatsOverviewResponse,
    ForgettingCurveResponse,
    MasteryResponse,
    HeatmapResponse,
    LearningAnalysisResponse,
)

__all__ = [
    # auth
    "UserCreate", "UserLogin", "UserResponse", "Token",
    # material
    "MaterialCreate", "MaterialResponse", "MaterialListResponse",
    # knowledge
    "KnowledgePointResponse", "KnowledgeRelationResponse", "GraphResponse", "KnowledgePointUpdate",
    # flashcard
    "FlashcardResponse", "ReviewRequest", "TodayCardsResponse",
    # study_plan
    "StudyPlanCreate", "StudyPlanUpdate", "StudyPlanResponse", "StudyPlanProgressItem",
    # note
    "NoteCreate", "NoteUpdate", "NoteResponse", "BacklinkItem", "NotesGraphResponse",
    # extra
    "MistakeCreate", "MistakeResponse", "MistakeListResponse",
    "WeaknessRadarResponse",
    "FocusSessionCreate", "FocusSessionResponse", "FocusStatsResponse",
    "LeaderboardEntry", "LeaderboardResponse",
    # stats
    "StatsOverviewResponse", "ForgettingCurveResponse", "MasteryResponse",
    "HeatmapResponse", "LearningAnalysisResponse",
]
