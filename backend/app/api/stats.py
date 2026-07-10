from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
import math
from collections import defaultdict
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.knowledge import KnowledgePoint
from app.models.flashcard import Flashcard
from app.models.review import ReviewSchedule, ReviewHistory
from app.models.material import Material
from app.schemas.stats import StatsOverviewResponse, ForgettingCurveResponse, ForgettingCurvePoint, MasteryResponse, MasteryItem, HeatmapResponse, HeatmapDay, LearningAnalysisResponse
from app.services.learning_analysis_service import generate_learning_analysis
# 改进 6：导入统一的 streak 计算服务，替代本地 _calculate_streak 函数
from app.services.streak_service import calculate_streak

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/overview", response_model=StatsOverviewResponse)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overview statistics."""
    total_points = db.query(KnowledgePoint).filter(
        KnowledgePoint.user_id == current_user.id
    ).count()

    mastered_points = db.query(KnowledgePoint).filter(
        KnowledgePoint.user_id == current_user.id,
        KnowledgePoint.mastery_level >= 0.8
    ).count()

    total_flashcards = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.is_active == True
    ).count()

    today = date.today()
    today_review = db.query(ReviewSchedule).filter(
        ReviewSchedule.user_id == current_user.id,
        ReviewSchedule.next_review <= today
    ).count()

    # New cards (no schedule yet)
    scheduled_ids = db.query(ReviewSchedule.flashcard_id).filter(
        ReviewSchedule.user_id == current_user.id
    ).subquery()
    new_count = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.is_active == True,
        ~Flashcard.id.in_(scheduled_ids)
    ).count()

    # Study streak
    # 改进 6：调用统一的 streak_service.calculate_streak，替代本地 _calculate_streak
    streak = calculate_streak(db, current_user.id)

    total_reviews = db.query(ReviewHistory).join(ReviewSchedule).filter(
        ReviewSchedule.user_id == current_user.id
    ).count()

    return StatsOverviewResponse(
        total_knowledge_points=total_points,
        mastered_points=mastered_points,
        total_flashcards=total_flashcards,
        today_review_count=today_review,
        today_new_count=new_count,
        study_streak=streak,
        total_reviews=total_reviews
    )


@router.get("/forgetting-curve", response_model=ForgettingCurveResponse)
def get_forgetting_curve(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get personalized forgetting curve based on user's real review data."""
    # 查询用户所有 ReviewHistory 记录，按闪卡分组
    histories = (
        db.query(ReviewHistory)
        .join(ReviewSchedule)
        .filter(ReviewSchedule.user_id == current_user.id)
        .order_by(ReviewHistory.reviewed_at)
        .all()
    )

    total_reviews = len(histories)

    # 如果用户数据不足（< 10 次复习），返回提示信息 + 理论曲线
    if total_reviews < 10:
        theoretical_curve = _generate_theoretical_curve()
        optimal_curve = _generate_optimal_curve()
        return ForgettingCurveResponse(
            user_curve=[],
            theoretical_curve=theoretical_curve,
            optimal_curve=optimal_curve,
            user_forget_rate=0.0,
            total_reviews_analyzed=total_reviews,
            analysis_days=0,
            message="复习数据不足（需至少 10 次），暂无法生成个性化遗忘曲线。请继续复习后再查看。"
        )

    # 按闪卡分组复习历史
    card_histories = defaultdict(list)
    for h in histories:
        card_histories[h.review_schedule_id].append(h)

    # 对于每张闪卡，计算"距离上次复习 N 天后的复习结果"
    # 按天数间隔分组，计算每组的平均正确率
    interval_correct = defaultdict(list)  # day_interval -> list of (0 or 1)
    analysis_days = 0

    for schedule_id, h_list in card_histories.items():
        if len(h_list) < 2:
            continue
        for i in range(1, len(h_list)):
            prev = h_list[i - 1]
            curr = h_list[i]
            # 计算两次复习之间的天数间隔
            days_gap = (curr.reviewed_at.date() - prev.reviewed_at.date()).days
            if days_gap < 0:
                continue
            # 质量 >= 3 视为正确（记住了）
            is_correct = 1 if curr.quality >= 3 else 0
            # 对天数取整分组，对于较大间隔使用更粗的粒度
            if days_gap <= 7:
                bucket = days_gap
            elif days_gap <= 30:
                bucket = (days_gap // 3) * 3  # 每 3 天一组
            else:
                bucket = (days_gap // 7) * 7  # 每 7 天一组
            interval_correct[bucket].append(is_correct)
            if days_gap > analysis_days:
                analysis_days = days_gap

    # 生成用户个性化遗忘曲线数据点
    user_curve = []
    for day in sorted(interval_correct.keys()):
        results = interval_correct[day]
        if len(results) > 0:
            retention_rate = sum(results) / len(results)
            user_curve.append(ForgettingCurvePoint(
                day=day,
                retention_rate=round(retention_rate, 4),
                sample_count=len(results)
            ))

    # 计算用户平均遗忘速率（基于前 7 天的斜率）
    user_forget_rate = _calculate_user_forget_rate(user_curve)

    # 生成理论自然遗忘曲线（Ebbinghaus: R = e^(-t/S)，S=2.5）
    theoretical_curve = _generate_theoretical_curve()

    # 生成最优间隔复习曲线（基于 SM-2 间隔的预期保留率）
    optimal_curve = _generate_optimal_curve()

    return ForgettingCurveResponse(
        user_curve=user_curve,
        theoretical_curve=theoretical_curve,
        optimal_curve=optimal_curve,
        user_forget_rate=round(user_forget_rate, 4),
        total_reviews_analyzed=total_reviews,
        analysis_days=analysis_days
    )


def _generate_theoretical_curve() -> list[ForgettingCurvePoint]:
    """生成理论自然遗忘曲线（Ebbinghaus: R = e^(-t/2.5)）。"""
    curve = []
    # 生成 0-30 天的数据点
    for t in range(0, 31):
        retention = math.exp(-t / 2.5)
        curve.append(ForgettingCurvePoint(
            day=t,
            retention_rate=round(retention, 4),
            sample_count=0
        ))
    return curve


def _generate_optimal_curve() -> list[ForgettingCurvePoint]:
    """生成最优间隔复习曲线（基于 SM-2 间隔的预期保留率）。

    SM-2 算法的典型间隔序列：1, 6, 10, 22, 54, 133...
    在每个间隔点，预期保留率约为 85-90%。
    两次复习之间，记忆强度按指数衰减。
    """
    # SM-2 典型间隔（以 ease_factor=2.5 计算）
    sm2_intervals = [1, 6, 15, 37]  # 1, 6, 6*2.5=15, 15*2.5≈37
    target_retention = 0.88  # 复习点的预期保留率

    curve = []
    prev_day = 0
    prev_retention = 1.0

    for interval in sm2_intervals:
        review_day = prev_day + interval
        # 从上次复习点到本次复习点，按指数衰减
        # 用公式 R(t) = R0 * e^(-k*t)，其中 k 使得 R(interval) = target_retention
        if prev_retention > 0 and target_retention > 0:
            k = -math.log(target_retention / prev_retention) / interval
        else:
            k = 0

        for t in range(prev_day, min(review_day + 1, 60)):
            dt = t - prev_day
            retention = prev_retention * math.exp(-k * dt) if k > 0 else prev_retention
            # 在复习当天，完成复习后保留率回升
            if t == review_day:
                retention = target_retention
            curve.append(ForgettingCurvePoint(
                day=t,
                retention_rate=round(retention, 4),
                sample_count=0
            ))

        prev_day = review_day
        prev_retention = target_retention

    # 如果还没到 30 天，继续补充
    if prev_day < 30:
        # 继续以最后一次的衰减速率补充
        if prev_retention > 0:
            k = -math.log(0.5) / 10  # 默认 10 天衰减一半
        for t in range(prev_day + 1, 31):
            dt = t - prev_day
            retention = prev_retention * math.exp(-k * dt)
            curve.append(ForgettingCurvePoint(
                day=t,
                retention_rate=round(max(0.0, retention), 4),
                sample_count=0
            ))

    # 去重并排序，只保留 day 唯一的点
    seen = set()
    unique_curve = []
    for p in curve:
        if p.day not in seen and p.day <= 30:
            seen.add(p.day)
            unique_curve.append(p)
    unique_curve.sort(key=lambda x: x.day)

    return unique_curve


def _calculate_user_forget_rate(user_curve: list[ForgettingCurvePoint]) -> float:
    """计算用户平均遗忘速率（基于前 7 天数据的线性回归斜率）。

    返回值：每天遗忘的保留率比例（正值表示每天遗忘多少）。
    """
    if len(user_curve) < 2:
        return 0.0

    # 只使用前 7 天的数据点来计算
    early_points = [p for p in user_curve if p.day <= 7 and p.sample_count >= 1]
    if len(early_points) < 2:
        return 0.0

    # 简单线性回归：y = a + b*x，其中 b 就是每天的遗忘速率
    n = len(early_points)
    sum_x = sum(p.day for p in early_points)
    sum_y = sum(p.retention_rate for p in early_points)
    sum_xy = sum(p.day * p.retention_rate for p in early_points)
    sum_xx = sum(p.day * p.day for p in early_points)

    denominator = n * sum_xx - sum_x * sum_x
    if denominator == 0:
        return 0.0

    slope = (n * sum_xy - sum_x * sum_y) / denominator
    # slope 为负表示遗忘（保留率随天数下降），取正值表示遗忘速率
    return -slope if slope < 0 else 0.0


@router.get("/mastery", response_model=MasteryResponse)
def get_mastery(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get mastery level per material."""
    materials = db.query(Material).filter(
        Material.user_id == current_user.id,
        Material.status == "completed"
    ).all()

    items = []
    for m in materials:
        points = db.query(KnowledgePoint).filter(
            KnowledgePoint.material_id == m.id
        ).all()
        
        total = len(points)
        mastered = sum(1 for p in points if p.mastery_level >= 0.8)
        avg_mastery = sum(p.mastery_level for p in points) / total if total > 0 else 0

        items.append(MasteryItem(
            material_id=m.id,
            material_title=m.title,
            mastery_level=round(avg_mastery, 2),
            total_points=total,
            mastered_points=mastered
        ))

    return MasteryResponse(items=items)


@router.get("/heatmap", response_model=HeatmapResponse)
def get_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get daily review counts for the past 365 days (GitHub-style heatmap)."""
    today = date.today()
    start_date = today - timedelta(days=364)

    # Query daily review counts
    rows = (
        db.query(
            func.date(ReviewHistory.reviewed_at).label("review_date"),
            func.count(ReviewHistory.id).label("cnt"),
        )
        .join(ReviewSchedule)
        .filter(
            ReviewSchedule.user_id == current_user.id,
            func.date(ReviewHistory.reviewed_at) >= start_date,
        )
        .group_by(func.date(ReviewHistory.reviewed_at))
        .all()
    )

    count_map = {str(r.review_date): r.cnt for r in rows}

    result = []
    current = start_date
    while current <= today:
        ds = current.isoformat()
        result.append(HeatmapDay(date=ds, count=count_map.get(ds, 0)))
        current += timedelta(days=1)

    return HeatmapResponse(data=result)



@router.get("/learning-analysis", response_model=LearningAnalysisResponse)
async def get_learning_analysis(
    type: str = "diagnosis",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate AI-powered learning analysis report."""
    result = await generate_learning_analysis(db, current_user, type)
    return result



@router.get("/trend")
def get_review_trend(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get daily review count trend for the past N days."""
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    rows = (
        db.query(
            func.date(ReviewHistory.reviewed_at).label("d"),
            func.count(ReviewHistory.id).label("cnt"),
        )
        .join(ReviewSchedule)
        .filter(
            ReviewSchedule.user_id == current_user.id,
            func.date(ReviewHistory.reviewed_at) >= start_date,
        )
        .group_by(func.date(ReviewHistory.reviewed_at))
        .all()
    )
    count_map = {str(r.d): r.cnt for r in rows}

    result = []
    current = start_date
    while current <= today:
        ds = current.isoformat()
        result.append({"date": ds, "label": current.strftime("%m/%d"), "count": count_map.get(ds, 0)})
        current += timedelta(days=1)

    return {"data": result}


@router.get("/radar")
def get_radar_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get mastery radar chart data grouped by material."""
    materials = db.query(Material).filter(
        Material.user_id == current_user.id,
        Material.status == "completed"
    ).limit(8).all()

    result = []
    for m in materials:
        points = db.query(KnowledgePoint).filter(KnowledgePoint.material_id == m.id).all()
        if not points:
            continue
        avg = sum(p.mastery_level for p in points) / len(points)
        result.append({
            "subject": m.title[:6],
            "mastery": round(avg * 100),
            "points": len(points),
        })

    return {"data": result}
