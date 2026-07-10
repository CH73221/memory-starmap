"""
xp_service.py - XP/等级系统服务

功能：
- 计算复习获得的 XP
- 根据总 XP 计算等级
- 给用户加 XP 并检查升级
- 更新连续学习天数
"""

import math
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.user import User


# 等级 XP 阈值列表（20 级）
# 公式推导：level = floor(sqrt(total_xp / 100)) + 1
# 每级需要的 XP: 100, 300, 500, 800, 1200... (递增)
LEVEL_THRESHOLDS = [
    0,       # Level 1
    100,     # Level 2
    400,     # Level 3  (100 + 300)
    900,     # Level 4  (400 + 500)
    1600,    # Level 5  (900 + 700)
    2500,    # Level 6  (1600 + 900)
    3600,    # Level 7  (2500 + 1100)
    4900,    # Level 8  (3600 + 1300)
    6400,    # Level 9  (4900 + 1500)
    8100,    # Level 10 (6400 + 1700)
    10000,   # Level 11 (8100 + 1900)
    12100,   # Level 12 (10000 + 2100)
    14400,   # Level 13 (12100 + 2300)
    16900,   # Level 14 (14400 + 2500)
    19600,   # Level 15 (16900 + 2700)
    22500,   # Level 16 (19600 + 2900)
    25600,   # Level 17 (22500 + 3100)
    28900,   # Level 18 (25600 + 3300)
    32400,   # Level 19 (28900 + 3500)
    36100,   # Level 20 (32400 + 3700)
]


def calculate_xp_for_review(quality: int, interval_days: int = 1, combo: int = 0) -> int:
    """
    计算一次复习获得的 XP。

    Args:
        quality: 复习质量评分 (0-5)
        interval_days: 复习间隔天数（用于长间隔加成）
        combo: 连击数（用于连击加成）

    Returns:
        int: 获得的 XP 数量
    """
    # 基础 XP
    if quality <= 2:
        base_xp = 5      # 答错也有少量经验
    elif quality == 3:
        base_xp = 10     # 勉强答对
    elif quality == 4:
        base_xp = 15     # 记得
    else:  # quality == 5
        base_xp = 20     # 完美回忆

    # 长间隔复习加成：interval > 7 天额外 +50%
    if interval_days > 7:
        base_xp = int(base_xp * 1.5)

    # 连击加成：每 5 连击 +10%，最多 +50%
    if combo > 0:
        combo_bonus = min(combo // 5, 5) * 0.1
        base_xp = int(base_xp * (1 + combo_bonus))

    return max(1, base_xp)


def calculate_level(total_xp: int) -> int:
    """
    根据总 XP 计算等级。

    等级公式: level = floor(sqrt(total_xp / 100)) + 1

    Args:
        total_xp: 总经验值

    Returns:
        int: 当前等级
    """
    if total_xp <= 0:
        return 1
    level = int(math.floor(math.sqrt(total_xp / 100))) + 1
    # 限制最高 20 级
    return min(level, 20)


def get_level_xp(level: int) -> int:
    """
    获取指定等级所需的 XP 阈值。

    Args:
        level: 等级 (1-20)

    Returns:
        int: 该等级的 XP 阈值
    """
    if level <= 1:
        return 0
    if level > 20:
        return LEVEL_THRESHOLDS[-1]
    return LEVEL_THRESHOLDS[level - 1]


def get_current_level_xp(total_xp: int) -> int:
    """获取当前等级已获得的 XP（相对于当前等级起点）"""
    level = calculate_level(total_xp)
    level_start = get_level_xp(level)
    return total_xp - level_start


def get_next_level_xp(total_xp: int) -> int:
    """获取距离下一级还需要的 XP"""
    level = calculate_level(total_xp)
    if level >= 20:
        return 0
    next_level_start = get_level_xp(level + 1)
    return max(0, next_level_start - total_xp)


def add_xp(db: Session, user_id: int, xp_amount: int, source: str = "review") -> dict:
    """
    给用户增加 XP。

    Args:
        db: 数据库会话
        user_id: 用户 ID
        xp_amount: 增加的 XP 数量
        source: XP 来源（review, focus, achievement 等）

    Returns:
        dict: {
            "xp_earned": int,
            "total_xp": int,
            "new_level": int,
            "leveled_up": bool,
            "old_level": int,
        }
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"xp_earned": 0, "total_xp": 0, "new_level": 1, "leveled_up": False, "old_level": 1}

    old_level = user.level
    old_total = user.total_xp or 0

    # 更新总 XP
    user.total_xp = old_total + xp_amount

    # 计算新等级
    new_level = calculate_level(user.total_xp)
    leveled_up = new_level > old_level

    if leveled_up:
        user.level = new_level

    db.commit()

    return {
        "xp_earned": xp_amount,
        "total_xp": user.total_xp,
        "new_level": user.level,
        "leveled_up": leveled_up,
        "old_level": old_level,
    }


def update_streak(db: Session, user_id: int) -> dict:
    """
    更新连续学习天数。

    逻辑：
    - 检查今天是否已复习过
    - 如果昨天复习了，streak + 1
    - 如果昨天没复习，streak 重置为 1
    - 更新 last_review_date

    Args:
        db: 数据库会话
        user_id: 用户 ID

    Returns:
        dict: {
            "streak": int,
            "last_review_date": date,
            "is_new_day": bool,
        }
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"streak": 0, "last_review_date": None, "is_new_day": False}

    today = date.today()
    last_date = user.last_review_date

    # 如果今天已经复习过，不更新 streak
    if last_date == today:
        return {
            "streak": user.streak or 0,
            "last_review_date": last_date,
            "is_new_day": False,
        }

    is_new_day = True

    if last_date is None:
        # 第一次复习
        user.streak = 1
    elif (today - last_date).days == 1:
        # 昨天复习了，连续 +1
        user.streak = (user.streak or 0) + 1
    else:
        # 昨天没复习，重置为 1
        user.streak = 1

    user.last_review_date = today
    db.commit()

    return {
        "streak": user.streak,
        "last_review_date": user.last_review_date,
        "is_new_day": is_new_day,
    }
