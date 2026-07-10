from datetime import datetime, date, timezone
from sqlalchemy import Integer, Float, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ReviewSchedule(Base):
    __tablename__ = "review_schedules"
    __table_args__ = (
        Index("ix_review_schedules_user_id_next_review", "user_id", "next_review"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    flashcard_id: Mapped[int] = mapped_column(Integer, ForeignKey("flashcards.id"), nullable=False, unique=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    interval_days: Mapped[int] = mapped_column(Integer, default=1)
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    next_review: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    last_review: Mapped[date | None] = mapped_column(Date, nullable=True)
    memory_strength: Mapped[float] = mapped_column(Float, default=1.0)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    flashcard = relationship("Flashcard", back_populates="review_schedule")
    histories = relationship("ReviewHistory", back_populates="review_schedule", cascade="all, delete-orphan")


class ReviewHistory(Base):
    __tablename__ = "review_histories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    review_schedule_id: Mapped[int] = mapped_column(Integer, ForeignKey("review_schedules.id"), nullable=False, index=True)
    quality: Mapped[int] = mapped_column(Integer, nullable=False)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    review_schedule = relationship("ReviewSchedule", back_populates="histories")
