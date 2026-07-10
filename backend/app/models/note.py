from datetime import datetime, timezone
from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Note(Base):
    """双链笔记 - 支持 [[标题]] 互链"""
    __tablename__ = "notes"
    __table_args__ = (
        Index("ix_notes_user_title", "user_id", "title", unique=True),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")
    is_daily: Mapped[bool] = mapped_column(Boolean, default=False)
    is_auto_created: Mapped[bool] = mapped_column(Boolean, default=False)  # 由 [[X]] 自动创建的空笔记
    tags: Mapped[str] = mapped_column(String(500), default="")  # 逗号分隔
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))