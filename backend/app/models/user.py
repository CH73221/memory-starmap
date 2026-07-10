from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import Integer, String, DateTime, Date
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # XP / 等级系统
    total_xp: Mapped[int] = mapped_column(Integer, default=0)  # 总经验值
    level: Mapped[int] = mapped_column(Integer, default=1)  # 当前等级
    streak: Mapped[int] = mapped_column(Integer, default=0)  # 连续学习天数
    last_review_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)  # 最后复习日期
