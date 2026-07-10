# -*- coding: utf-8 -*-
"""
streak_service.py - 连续学习天数计算服务（改进 6 - 消除重复 streak 计算）

优化思路：
- 原先各处的 _calculate_streak 函数采用 while 循环逐日查询数据库，存在 N+1 性能问题
- 本服务通过单次查询所有复习日期（func.date + distinct），然后在 Python 中计算连续天数
- 全项目统一调用，消除重复实现
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta

from app.models.review import ReviewHistory, ReviewSchedule


def calculate_streak(db: Session, user_id: int) -> int:
    """
    计算用户的连续学习天数（从今天往回数）。

    优化方案：
    - 单次查询获取该用户所有有复习记录的日期（去重），避免逐日查询的 N+1 问题
    - 在 Python 中利用集合的 O(1) 查找来计算连续天数

    Args:
        db: 数据库会话
        user_id: 用户 ID

    Returns:
        int: 连续学习天数
    """
    today = date.today()

    # 改进 6：单次查询所有复习日期（去重），替代原先 while 循环逐日查询
    # 使用 func.date 将 datetime 转换为 date，再用 distinct 去重
    review_dates_rows = db.query(
        func.date(ReviewHistory.reviewed_at).label("review_date")
    ).join(
        ReviewSchedule, ReviewHistory.review_schedule_id == ReviewSchedule.id
    ).filter(
        ReviewSchedule.user_id == user_id
    ).distinct().all()

    # 将日期存入集合，方便 O(1) 查找
    review_dates = {row.review_date for row in review_dates_rows}

    # 从今天开始往回数，计算连续天数
    streak = 0
    current_date = today
    while current_date in review_dates:
        streak += 1
        current_date -= timedelta(days=1)

    return streak
