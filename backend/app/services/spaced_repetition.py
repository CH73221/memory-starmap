from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from app.models.flashcard import Flashcard
from app.models.review import ReviewSchedule, ReviewHistory
from app.models.knowledge import KnowledgePoint
from app.models.extra import Mistake, MistakeKnowledgeRelation
from app.services import xp_service
from app.services import achievement_service


def sm2_algorithm(quality: int, repetitions: int, ease_factor: float, interval: int) -> tuple:
    """
    SM-2 spaced repetition algorithm.
    
    Args:
        quality: Rating 0-5 (0=complete blackout, 3=barely correct, 5=perfect recall)
        repetitions: Consecutive correct answers
        ease_factor: Ease factor (default 2.5)
        interval: Current interval in days
    
    Returns:
        Tuple of (new_interval, new_repetitions, new_ease_factor)
    """
    if quality >= 3:  # Correct response
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval * ease_factor)
        new_repetitions = repetitions + 1
    else:  # Incorrect response
        new_repetitions = 0
        new_interval = 1

    # Update ease factor
    new_ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ease_factor = max(1.3, new_ease_factor)  # Minimum 1.3

    return new_interval, new_repetitions, new_ease_factor


def calculate_memory_strength(schedule: ReviewSchedule) -> float:
    """Calculate current memory strength based on time since last review."""
    if not schedule.last_review:
        return 0.0

    days_since_review = (date.today() - schedule.last_review).days
    if days_since_review <= 0:
        return 1.0

    # Exponential decay based on interval
    decay_rate = 1.0 / schedule.interval_days
    strength = max(0.0, 1.0 - (days_since_review * decay_rate))
    return min(1.0, strength)


def get_today_cards(db: Session, user_id: int) -> dict:
    """Get flashcards due for review today."""
    today = date.today()

    # Get cards due for review (next_review <= today)
    review_cards = db.query(ReviewSchedule).filter(
        ReviewSchedule.user_id == user_id,
        ReviewSchedule.next_review <= today
    ).all()

    flashcard_ids = [r.flashcard_id for r in review_cards]
    flashcards = db.query(Flashcard).options(
        joinedload(Flashcard.knowledge_point)
    ).filter(
        Flashcard.id.in_(flashcard_ids),
        Flashcard.is_active == True
    ).all() if flashcard_ids else []

    # Count new cards (no review schedule yet)
    scheduled_ids = db.query(ReviewSchedule.flashcard_id).filter(
        ReviewSchedule.user_id == user_id
    ).subquery()

    new_count = db.query(Flashcard).filter(
        Flashcard.user_id == user_id,
        Flashcard.is_active == True,
        ~Flashcard.id.in_(scheduled_ids)
    ).count()

    return {
        "cards": flashcards,
        "total": len(flashcards),
        "new_count": new_count,
        "review_count": len(flashcards)
    }


def _diagnose_mistake_type(quality: int, history_count: int = 0) -> tuple[str, str]:
    """
    根据 quality 和历史数据诊断错误类型。

    Args:
        quality: 复习质量评分 (0-2)
        history_count: 该闪卡历史错误次数

    Returns:
        tuple: (diagnosis, explanation)
    """
    if quality == 0:
        diagnosis = "完全遗忘"
        explanation = "你对这道题完全没有印象了，说明记忆痕迹已经消退。建议：立即重新学习，建立新的记忆连接，24小时内复习3次。"
    elif quality == 1:
        diagnosis = "记忆模糊"
        explanation = "你对这道题有模糊的印象，但无法准确回忆。建议：使用主动回忆法，尝试从记忆中提取答案，再对照正确答案强化。"
    else:  # quality == 2
        diagnosis = "概念混淆"
        explanation = "你对概念有印象，但容易与相似知识点混淆。建议：制作对比表格，找出相似概念的关键区别，用联想记忆法区分。"

    return diagnosis, explanation


def _auto_create_mistake(db: Session, user_id: int, flashcard_id: int, quality: int) -> Mistake | None:
    """
    当 quality < 3 时自动创建错题记录。

    - 避免重复：同一天同一闪卡只创建一条错题
    - 诊断错误类型
    - 关联知识点

    Returns:
        Mistake | None: 创建的错题记录，如果已存在则返回 None
    """
    today = date.today()

    # 检查今天是否已为该闪卡创建过错题（避免重复）
    existing = db.query(Mistake).filter(
        Mistake.user_id == user_id,
        Mistake.flashcard_id == flashcard_id,
        func.date(Mistake.created_at) == today,
    ).first()
    if existing:
        return existing

    # 查询闪卡信息
    flashcard = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if not flashcard:
        return None

    # 查询该闪卡历史错误次数
    history_count = db.query(ReviewHistory).join(
        ReviewSchedule, ReviewHistory.review_schedule_id == ReviewSchedule.id
    ).filter(
        ReviewSchedule.flashcard_id == flashcard_id,
        ReviewSchedule.user_id == user_id,
        ReviewHistory.quality < 3,
    ).count()

    # 诊断错误类型
    diagnosis, explanation = _diagnose_mistake_type(quality, history_count)

    # 获取关联知识点 ID
    kp_id = flashcard.knowledge_point_id
    related_ids_str = str(kp_id) if kp_id else None

    # 创建错题记录
    mistake = Mistake(
        user_id=user_id,
        flashcard_id=flashcard_id,
        question=flashcard.question,
        user_answer=None,  # 自动入错题本时用户答案为空
        correct_answer=flashcard.answer,
        diagnosis=diagnosis,
        ai_explanation=explanation,
        related_knowledge_ids=related_ids_str,
    )
    db.add(mistake)
    db.flush()  # 获取 mistake.id

    # 建立多对多关联
    if kp_id:
        relation = MistakeKnowledgeRelation(
            mistake_id=mistake.id,
            knowledge_id=kp_id,
        )
        db.add(relation)

    return mistake


def update_after_review(db: Session, schedule_id: int, quality: int, combo: int = 0, response_time_ms: int | None = None) -> dict:
    """
    更新复习后的复习计划。

    扩展功能：
    - quality < 3 时自动创建错题记录
    - 增加 XP 和等级系统
    - 更新连续学习天数
    - 检查成就解锁

    Args:
        db: 数据库会话
        schedule_id: 复习计划 ID
        quality: 复习质量 (0-5)
        combo: 当前连击数（用于 XP 加成）

    Returns:
        dict: 包含 schedule, xp_earned, leveled_up, new_level, new_streak, mistake_created 等信息
    """
    schedule = db.query(ReviewSchedule).filter(ReviewSchedule.id == schedule_id).first()
    if not schedule:
        return None

    user_id = schedule.user_id
    old_interval = schedule.interval_days

    # Apply SM-2 algorithm
    new_interval, new_reps, new_ease = sm2_algorithm(
        quality=quality,
        repetitions=schedule.repetitions,
        ease_factor=schedule.ease_factor,
        interval=schedule.interval_days
    )

    # Update schedule
    schedule.interval_days = new_interval
    schedule.repetitions = new_reps
    schedule.ease_factor = new_ease
    schedule.last_review = date.today()
    schedule.next_review = date.today() + timedelta(days=new_interval)
    schedule.total_reviews += 1
    schedule.memory_strength = 1.0 if quality >= 3 else 0.3

    # Create history record
    history = ReviewHistory(
        review_schedule_id=schedule.id,
        quality=quality,
        response_time_ms=response_time_ms,
    )
    db.add(history)

    # Update knowledge point mastery level
    flashcard = db.query(Flashcard).filter(Flashcard.id == schedule.flashcard_id).first()
    if flashcard and flashcard.knowledge_point_id:
        _update_knowledge_mastery(db, flashcard.knowledge_point_id, quality, old_interval)

    # ===== 任务1.1: 答错自动入错题本 =====
    mistake_created = None
    if quality < 3:
        mistake_created = _auto_create_mistake(db, user_id, schedule.flashcard_id, quality)

    # ===== 任务2.3: 在复习流程中集成 XP =====
    # 计算获得的 XP
    xp_earned = xp_service.calculate_xp_for_review(
        quality=quality,
        interval_days=old_interval,
        combo=combo,
    )

    # 增加 XP
    xp_result = xp_service.add_xp(db, user_id, xp_earned, source="review")

    # 更新连续学习天数
    streak_result = xp_service.update_streak(db, user_id)

    # ===== 成就检查 =====
    # 计算今日复习统计
    today = date.today()
    today_histories = db.query(ReviewHistory).join(
        ReviewSchedule, ReviewHistory.review_schedule_id == ReviewSchedule.id
    ).filter(
        ReviewSchedule.user_id == user_id,
        func.date(ReviewHistory.reviewed_at) == today,
    ).all()

    review_count_today = len(today_histories)
    correct_count_today = sum(1 for h in today_histories if h.quality >= 3)

    # 累计复习次数
    total_reviews = db.query(ReviewHistory).join(
        ReviewSchedule, ReviewHistory.review_schedule_id == ReviewSchedule.id
    ).filter(
        ReviewSchedule.user_id == user_id,
    ).count()

    # 已掌握知识点数 (mastery_level >= 0.8)
    mastered_points = db.query(KnowledgePoint).filter(
        KnowledgePoint.user_id == user_id,
        KnowledgePoint.mastery_level >= 0.8,
    ).count()

    # 已解决错题数
    from app.models.extra import Mistake
    mistakes_solved = db.query(Mistake).filter(
        Mistake.user_id == user_id,
        Mistake.resolved == True,
    ).count()

    # 构建成就上下文
    from datetime import datetime
    context = {
        "review_count_today": review_count_today,
        "correct_count_today": correct_count_today,
        "total_reviews": total_reviews,
        "streak": streak_result["streak"],
        "mastered_points": mastered_points,
        "mistakes_solved": mistakes_solved,
        "max_combo": combo,
        "review_hour": datetime.now().hour,
    }

    new_achievements = achievement_service.check_achievements(db, user_id, context)

    db.commit()
    db.refresh(schedule)

    return {
        "schedule": schedule,
        "xp_earned": xp_result["xp_earned"],
        "total_xp": xp_result["total_xp"],
        "leveled_up": xp_result["leveled_up"],
        "new_level": xp_result["new_level"],
        "old_level": xp_result["old_level"],
        "new_streak": streak_result["streak"],
        "is_new_day": streak_result["is_new_day"],
        "mistake_created": mistake_created is not None and mistake_created.created_at.date() == today,
        "new_achievements": new_achievements,
    }


def _get_last_review_quality(db: Session, knowledge_point_id: int, user_id: int) -> int | None:
    """
    查询某个知识点上次复习的 quality 结果（用于判断连续答错）。

    返回最近一次该知识点下所有闪卡复习的 quality，
    如果没有历史记录则返回 None。
    """
    last_history = db.query(ReviewHistory).join(
        ReviewSchedule, ReviewHistory.review_schedule_id == ReviewSchedule.id
    ).join(
        Flashcard, ReviewSchedule.flashcard_id == Flashcard.id
    ).filter(
        Flashcard.knowledge_point_id == knowledge_point_id,
        ReviewSchedule.user_id == user_id,
    ).order_by(
        ReviewHistory.reviewed_at.desc()
    ).first()

    if last_history:
        return last_history.quality
    return None


def _update_knowledge_mastery(db: Session, knowledge_point_id: int, quality: int, interval_days: int = 0):
    """
    基于 Elo 评分思想的掌握度更新：
    - 每次复习相当于一次"对战"，掌握度向预期值调整
    - 长间隔答对，掌握度提升更多（证明真正记住了）
    - 连续答错加速下降（越不会越容易忘的正反馈）
    - 考虑知识点的闪卡数量（闪卡越多，单张影响越小）
    """
    from datetime import datetime
    import math

    kp = db.query(KnowledgePoint).filter(KnowledgePoint.id == knowledge_point_id).first()
    if not kp:
        return

    # 更新复习次数和最后复习时间
    kp.review_count += 1
    kp.last_reviewed_at = datetime.now(timezone.utc)

    current_mastery = kp.mastery_level

    # 1. 查询该知识点的闪卡数量
    card_count = db.query(Flashcard).filter(
        Flashcard.knowledge_point_id == knowledge_point_id,
        Flashcard.is_active == True
    ).count()
    if card_count < 1:
        card_count = 1  # 防止除零

    # 2. 计算 K 值（学习率）
    K = 0.05
    # 闪卡数量修正：单卡影响随卡数递减
    K = K * (1.0 / math.sqrt(card_count))
    # 间隔加成：如果 interval_days > 3 且答对，长间隔答对加更多
    if interval_days > 3 and quality >= 3:
        K *= (1 + interval_days / 30.0)

    # 3. 计算预期掌握度变化
    if quality >= 4:
        delta = K * (1 - current_mastery) * (quality / 5.0)
    elif quality == 3:
        delta = K * 0.2 * (quality - 2.5)  # 小幅波动
    else:  # quality <= 2
        delta = -K * current_mastery * (1 + (2 - quality) * 0.3)  # 答错更多降更快

    # 4. 连续答错检测：如果上次复习也是答错，delta *= 1.5
    if quality < 3:
        kp.consecutive_wrong += 1
        last_quality = _get_last_review_quality(db, knowledge_point_id, kp.user_id)
        if last_quality is not None and last_quality < 3:
            delta *= 1.5
    else:
        kp.consecutive_wrong = 0

    # 5. 限制在 [0, 1] 范围内
    kp.mastery_level = max(0.0, min(1.0, current_mastery + delta))
