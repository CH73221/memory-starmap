"""
achievement_service.py - 成就系统服务

定义 20 个成就及解锁检查逻辑。
"""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import Optional

from app.models.achievement import Achievement
from app.models.user import User


# 成就定义
ACHIEVEMENT_DEFINITIONS = [
    {
        "key": "first_card",
        "name": "初出茅庐",
        "description": "完成第一次复习",
        "icon": "🎯",
        "rarity": "common",
    },
    {
        "key": "ten_cards_day",
        "name": "勤学苦练",
        "description": "单日复习 10 张卡片",
        "icon": "📚",
        "rarity": "common",
    },
    {
        "key": "fifty_cards_day",
        "name": "废寝忘食",
        "description": "单日复习 50 张卡片",
        "icon": "🔥",
        "rarity": "rare",
    },
    {
        "key": "streak_7",
        "name": "周而复始",
        "description": "连续学习 7 天",
        "icon": "📅",
        "rarity": "common",
    },
    {
        "key": "streak_30",
        "name": "持之以恒",
        "description": "连续学习 30 天",
        "icon": "🏆",
        "rarity": "epic",
    },
    {
        "key": "streak_100",
        "name": "百日筑基",
        "description": "连续学习 100 天",
        "icon": "👑",
        "rarity": "legendary",
    },
    {
        "key": "first_material",
        "name": "学海无涯",
        "description": "上传第一份学习资料",
        "icon": "📄",
        "rarity": "common",
    },
    {
        "key": "knowledge_10",
        "name": "初窥门径",
        "description": "掌握 10 个知识点",
        "icon": "🧠",
        "rarity": "common",
    },
    {
        "key": "knowledge_50",
        "name": "融会贯通",
        "description": "掌握 50 个知识点",
        "icon": "💡",
        "rarity": "rare",
    },
    {
        "key": "knowledge_100",
        "name": "博学多才",
        "description": "掌握 100 个知识点",
        "icon": "🎓",
        "rarity": "epic",
    },
    {
        "key": "flashcard_100",
        "name": "百炼成钢",
        "description": "累计复习 100 次",
        "icon": "💪",
        "rarity": "common",
    },
    {
        "key": "flashcard_1000",
        "name": "千锤百炼",
        "description": "累计复习 1000 次",
        "icon": "⚔️",
        "rarity": "epic",
    },
    {
        "key": "perfect_day",
        "name": "完美一天",
        "description": "单日正确率 100%（至少 10 张）",
        "icon": "✨",
        "rarity": "rare",
    },
    {
        "key": "night_owl",
        "name": "夜猫子",
        "description": "凌晨 2-5 点复习",
        "icon": "🦉",
        "rarity": "rare",
    },
    {
        "key": "early_bird",
        "name": "早起鸟",
        "description": "早上 5-7 点复习",
        "icon": "🐦",
        "rarity": "common",
    },
    {
        "key": "focus_master",
        "name": "专注大师",
        "description": "累计专注 1000 分钟",
        "icon": "⏱️",
        "rarity": "epic",
    },
    {
        "key": "note_writer",
        "name": "笔耕不辍",
        "description": "创建 10 篇笔记",
        "icon": "📝",
        "rarity": "common",
    },
    {
        "key": "mistake_solver",
        "name": "错题克星",
        "description": "解决 50 道错题",
        "icon": "✅",
        "rarity": "rare",
    },
    {
        "key": "combo_10",
        "name": "连击达人",
        "description": "单次复习 10 连击",
        "icon": "🎮",
        "rarity": "rare",
    },
    {
        "key": "perfect_week",
        "name": "完美一周",
        "description": "连续 7 天正确率 90%+",
        "icon": "🌟",
        "rarity": "legendary",
    },
]


def _get_achievement_def(key: str) -> Optional[dict]:
    """根据 key 获取成就定义"""
    for a in ACHIEVEMENT_DEFINITIONS:
        if a["key"] == key:
            return a
    return None


def _get_user_achievement_map(db: Session, user_id: int) -> dict[str, Achievement]:
    """获取用户已解锁成就的映射表"""
    achievements = db.query(Achievement).filter(Achievement.user_id == user_id).all()
    return {a.achievement_key: a for a in achievements}


def _unlock_achievement(db: Session, user_id: int, key: str, progress: dict = None) -> Optional[Achievement]:
    """
    解锁一个成就。如果已解锁则返回 None。
    """
    existing = db.query(Achievement).filter(
        Achievement.user_id == user_id,
        Achievement.achievement_key == key,
    ).first()
    if existing and existing.unlocked_at:
        return None  # 已解锁

    if existing:
        existing.unlocked_at = datetime.now(timezone.utc)
        existing.progress = progress or existing.progress
    else:
        achievement = Achievement(
            user_id=user_id,
            achievement_key=key,
            unlocked_at=datetime.now(timezone.utc),
            progress=progress,
        )
        db.add(achievement)
        existing = achievement

    db.commit()
    db.refresh(existing)
    return existing


def check_achievements(db: Session, user_id: int, context: dict) -> list[dict]:
    """
    检查并解锁成就。

    Args:
        db: 数据库会话
        user_id: 用户 ID
        context: 上下文字典，可包含：
            - review_count_today: 今日复习数
            - correct_count_today: 今日正确数
            - total_reviews: 累计复习次数
            - streak: 连续学习天数
            - mastered_points: 已掌握知识点数
            - materials_count: 上传资料数
            - focus_minutes: 累计专注分钟数
            - notes_count: 笔记数
            - mistakes_solved: 已解决错题数
            - max_combo: 最高连击数
            - review_hour: 当前复习小时 (0-23)

    Returns:
        list[dict]: 本次新解锁的成就列表
    """
    unlocked_map = _get_user_achievement_map(db, user_id)
    newly_unlocked = []

    # 辅助函数：检查并解锁
    def try_unlock(key: str, condition: bool, progress: dict = None):
        if condition and key not in unlocked_map:
            ach = _unlock_achievement(db, user_id, key, progress)
            if ach:
                unlocked_map[key] = ach
                newly_unlocked.append(_build_achievement_info(key, ach))

    # 1. first_card - 完成第一次复习
    total_reviews = context.get("total_reviews", 0)
    try_unlock("first_card", total_reviews >= 1)

    # 2. ten_cards_day - 单日复习 10 张
    review_today = context.get("review_count_today", 0)
    try_unlock("ten_cards_day", review_today >= 10)

    # 3. fifty_cards_day - 单日复习 50 张
    try_unlock("fifty_cards_day", review_today >= 50)

    # 4. streak_7 - 连续 7 天
    streak = context.get("streak", 0)
    try_unlock("streak_7", streak >= 7)

    # 5. streak_30 - 连续 30 天
    try_unlock("streak_30", streak >= 30)

    # 6. streak_100 - 连续 100 天
    try_unlock("streak_100", streak >= 100)

    # 7. first_material - 上传第一份资料
    materials_count = context.get("materials_count", 0)
    try_unlock("first_material", materials_count >= 1)

    # 8. knowledge_10 - 掌握 10 个知识点
    mastered = context.get("mastered_points", 0)
    try_unlock("knowledge_10", mastered >= 10)

    # 9. knowledge_50 - 掌握 50 个知识点
    try_unlock("knowledge_50", mastered >= 50)

    # 10. knowledge_100 - 掌握 100 个知识点
    try_unlock("knowledge_100", mastered >= 100)

    # 11. flashcard_100 - 累计复习 100 次
    try_unlock("flashcard_100", total_reviews >= 100)

    # 12. flashcard_1000 - 累计复习 1000 次
    try_unlock("flashcard_1000", total_reviews >= 1000)

    # 13. perfect_day - 单日正确率 100%（至少 10 张）
    correct_today = context.get("correct_count_today", 0)
    if review_today >= 10 and review_today > 0:
        accuracy = correct_today / review_today
        try_unlock("perfect_day", accuracy >= 1.0)

    # 14. night_owl - 凌晨 2-5 点复习
    review_hour = context.get("review_hour")
    if review_hour is not None:
        try_unlock("night_owl", 2 <= review_hour < 5)

    # 15. early_bird - 早上 5-7 点复习
    if review_hour is not None:
        try_unlock("early_bird", 5 <= review_hour < 7)

    # 16. focus_master - 累计专注 1000 分钟
    focus_minutes = context.get("focus_minutes", 0)
    try_unlock("focus_master", focus_minutes >= 1000)

    # 17. note_writer - 创建 10 篇笔记
    notes_count = context.get("notes_count", 0)
    try_unlock("note_writer", notes_count >= 10)

    # 18. mistake_solver - 解决 50 道错题
    mistakes_solved = context.get("mistakes_solved", 0)
    try_unlock("mistake_solver", mistakes_solved >= 50)

    # 19. combo_10 - 单次复习 10 连击
    max_combo = context.get("max_combo", 0)
    try_unlock("combo_10", max_combo >= 10)

    # 20. perfect_week - 连续 7 天正确率 90%+
    # 这个成就需要更复杂的计算，这里用 context 中的标志位
    perfect_week = context.get("perfect_week", False)
    try_unlock("perfect_week", perfect_week)

    return newly_unlocked


def _build_achievement_info(key: str, achievement: Achievement | None = None) -> dict:
    """构建成就信息字典"""
    definition = _get_achievement_def(key)
    if not definition:
        return {}

    return {
        "key": key,
        "name": definition["name"],
        "description": definition["description"],
        "icon": definition["icon"],
        "rarity": definition["rarity"],
        "unlocked": achievement is not None and achievement.unlocked_at is not None,
        "unlocked_at": achievement.unlocked_at.isoformat() if achievement and achievement.unlocked_at else None,
        "progress": achievement.progress if achievement else None,
    }


def get_user_achievements(db: Session, user_id: int) -> list[dict]:
    """
    获取用户的全部成就列表（含未解锁）。

    Returns:
        list[dict]: 所有成就及解锁状态
    """
    unlocked_map = _get_user_achievement_map(db, user_id)
    result = []

    for definition in ACHIEVEMENT_DEFINITIONS:
        key = definition["key"]
        ach = unlocked_map.get(key)
        result.append(_build_achievement_info(key, ach))

    return result


def get_unlocked_achievements(db: Session, user_id: int) -> list[dict]:
    """
    获取用户已解锁的成就列表。

    Returns:
        list[dict]: 已解锁成就列表
    """
    all_achievements = get_user_achievements(db, user_id)
    return [a for a in all_achievements if a["unlocked"]]
