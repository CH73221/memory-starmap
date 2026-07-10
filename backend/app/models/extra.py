from datetime import datetime, timezone
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Float, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class MistakeKnowledgeRelation(Base):
    """错题与知识点多对多关联表"""
    __tablename__ = "mistake_knowledge_relations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mistake_id: Mapped[int] = mapped_column(Integer, ForeignKey("mistakes.id"), nullable=False)
    knowledge_id: Mapped[int] = mapped_column(Integer, ForeignKey("knowledge_points.id"), nullable=False)

    __table_args__ = (
        UniqueConstraint("mistake_id", "knowledge_id", name="uq_mistake_knowledge"),
    )


class Mistake(Base):
    """错题本 - 复习时打错的卡片自动入错题本"""
    __tablename__ = "mistakes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    flashcard_id: Mapped[int] = mapped_column(Integer, ForeignKey("flashcards.id"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    user_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)

    # AI 诊断
    diagnosis: Mapped[str] = mapped_column(String(50), default="memory_decay")
    # memory_decay | concept_misunderstanding | careless | unknown
    ai_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    related_knowledge_ids: Mapped[str | None] = mapped_column(String(500), nullable=True)  # comma-separated

    # 状态
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # 复习计数（用于答对 2 次自动标记已解决）
    correct_count: Mapped[int] = mapped_column(Integer, default=0)

    # 多对多关联知识点
    knowledge_points = relationship(
        "KnowledgePoint",
        secondary="mistake_knowledge_relations",
        backref="mistakes"
    )


class FocusSession(Base):
    """专注记录 - 番茄钟每次完成的会话"""
    __tablename__ = "focus_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=25)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    ambient_sound: Mapped[str] = mapped_column(String(30), default="none")
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
