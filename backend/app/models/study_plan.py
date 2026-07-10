from datetime import datetime, date, timezone
from sqlalchemy import Integer, String, Text, Date, DateTime, ForeignKey, Float, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_type: Mapped[str] = mapped_column(String(30), default="flashcards")  # flashcards/material/knowledge
    target_material_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("materials.id"), nullable=True)
    target_count: Mapped[int] = mapped_column(Integer, default=20)  # 目标数量（如 20 张闪卡）
    daily_target: Mapped[int] = mapped_column(Integer, default=10)  # 每日目标
    duration_days: Mapped[int] = mapped_column(Integer, default=30)  # 计划总天数
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active")  # active/completed/paused
    icon: Mapped[str] = mapped_column(String(20), default="📚")
    color: Mapped[str] = mapped_column(String(20), default="indigo")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship to daily progress
    progress_records: Mapped[list["StudyPlanProgress"]] = relationship(
        "StudyPlanProgress", back_populates="plan", cascade="all, delete-orphan"
    )


class StudyPlanProgress(Base):
    __tablename__ = "study_plan_progress"
    __table_args__ = (
        Index("ix_study_plan_progress_plan_id_progress_date", "plan_id", "progress_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("study_plans.id"), nullable=False, index=True)
    progress_date: Mapped[date] = mapped_column(Date, nullable=False)
    completed_count: Mapped[int] = mapped_column(Integer, default=0)
    target_count: Mapped[int] = mapped_column(Integer, default=0)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)  # 手动打卡备注
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    plan: Mapped["StudyPlan"] = relationship("StudyPlan", back_populates="progress_records")