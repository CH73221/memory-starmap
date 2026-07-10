from datetime import datetime, timezone
from sqlalchemy import Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class KnowledgePoint(Base):
    __tablename__ = "knowledge_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    material_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("materials.id"), nullable=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    importance: Mapped[int] = mapped_column(Integer, default=3)
    mastery_level: Mapped[float] = mapped_column(Float, default=0.2, index=True)
    review_count: Mapped[int] = mapped_column(Integer, default=0)  # 累计复习次数
    consecutive_wrong: Mapped[int] = mapped_column(Integer, default=0)  # 连续答错次数
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # 最后复习时间
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    material = relationship("Material", back_populates="knowledge_points")
    flashcards = relationship("Flashcard", back_populates="knowledge_point", cascade="all, delete-orphan")
    outgoing_relations = relationship("KnowledgeRelation", foreign_keys="KnowledgeRelation.source_id", back_populates="source", cascade="all, delete-orphan")
    incoming_relations = relationship("KnowledgeRelation", foreign_keys="KnowledgeRelation.target_id", back_populates="target", cascade="all, delete-orphan")


class KnowledgeRelation(Base):
    __tablename__ = "knowledge_relations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[int] = mapped_column(Integer, ForeignKey("knowledge_points.id"), nullable=False)
    target_id: Mapped[int] = mapped_column(Integer, ForeignKey("knowledge_points.id"), nullable=False)
    relation_type: Mapped[str] = mapped_column(String(50), nullable=False, default="related")
    # 可选值: "prerequisite" (前置知识), "related" (相关概念), "part_of" (包含关系), "similar" (相似概念)
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)  # 关系描述
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    source = relationship("KnowledgePoint", foreign_keys=[source_id], back_populates="outgoing_relations")
    target = relationship("KnowledgePoint", foreign_keys=[target_id], back_populates="incoming_relations")
