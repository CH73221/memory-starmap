from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.study_plan import StudyPlan, StudyPlanProgress
from app.models.flashcard import Flashcard
from app.models.review import ReviewHistory, ReviewSchedule
from app.models.knowledge import KnowledgePoint
from app.models.material import Material
from app.schemas.study_plan import (
    StudyPlanCreate, StudyPlanUpdate, StudyPlanResponse,
    StudyPlanProgressItem,
)

router = APIRouter(prefix="/api/study-plans", tags=["study-plans"])


def _to_response(plan: StudyPlan, db: Session) -> StudyPlanResponse:
    """Convert StudyPlan to Response with computed fields."""
    # Calculate completed count
    completed_count = db.query(StudyPlanProgress).filter(
        StudyPlanProgress.plan_id == plan.id,
        StudyPlanProgress.is_completed == True
    ).count()

    # Progress percentage
    elapsed_days = (date.today() - plan.start_date).days + 1
    total_days = (plan.end_date - plan.start_date).days + 1
    progress_pct = min(100, max(0, (elapsed_days / total_days) * 100)) if total_days > 0 else 0

    # Today's progress
    today_progress_rec = db.query(StudyPlanProgress).filter(
        StudyPlanProgress.plan_id == plan.id,
        StudyPlanProgress.progress_date == date.today()
    ).first()
    today_progress = today_progress_rec.completed_count if today_progress_rec else 0

    # Days remaining
    days_remaining = max(0, (plan.end_date - date.today()).days)

    # Progress history (last 30 days)
    progress_records = db.query(StudyPlanProgress).filter(
        StudyPlanProgress.plan_id == plan.id
    ).order_by(StudyPlanProgress.progress_date).limit(30).all()

    progress_items = [
        StudyPlanProgressItem(
            id=p.id,
            progress_date=p.progress_date,
            completed_count=p.completed_count,
            target_count=p.target_count,
            is_completed=p.is_completed,
            note=p.note,
        )
        for p in progress_records
    ]

    # 计算过去 7 天日均完成数
    seven_days_ago = date.today() - timedelta(days=6)
    last_7_days_progress = db.query(StudyPlanProgress).filter(
        StudyPlanProgress.plan_id == plan.id,
        StudyPlanProgress.progress_date >= seven_days_ago,
        StudyPlanProgress.progress_date <= date.today()
    ).all()

    if last_7_days_progress:
        daily_average = sum(p.completed_count for p in last_7_days_progress) / len(last_7_days_progress)
    else:
        daily_average = 0.0

    # 计算预测完成日期
    predicted_completion_date = None
    on_track = False

    if plan.status == "active" and daily_average > 0:
        # 计算还剩多少目标需要完成
        # 假设目标是累计完成 target_count 张闪卡或达到 target_count 天的学习
        total_completed_so_far = sum(p.completed_count for p in progress_records)
        remaining = max(0, plan.target_count - total_completed_so_far)

        if remaining > 0:
            days_needed = remaining / daily_average
            predicted_completion_date = date.today() + timedelta(days=round(days_needed))
        else:
            predicted_completion_date = date.today()

        # 判断是否按计划进行：比较日均完成数与每日目标
        on_track = daily_average >= plan.daily_target * 0.8

    return StudyPlanResponse(
        id=plan.id,
        user_id=plan.user_id,
        title=plan.title,
        description=plan.description,
        target_type=plan.target_type,
        target_material_id=plan.target_material_id,
        target_count=plan.target_count,
        daily_target=plan.daily_target,
        duration_days=plan.duration_days,
        start_date=plan.start_date,
        end_date=plan.end_date,
        status=plan.status,
        icon=plan.icon,
        color=plan.color,
        completed_count=completed_count,
        progress_percentage=round(progress_pct, 1),
        today_progress=today_progress,
        days_remaining=days_remaining,
        progress=progress_items,
        predicted_completion_date=predicted_completion_date,
        daily_average=round(daily_average, 2),
        on_track=on_track,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
    )


@router.get("/", response_model=list[StudyPlanResponse])
def list_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all study plans for the current user."""
    plans = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id
    ).order_by(desc(StudyPlan.created_at)).all()
    return [_to_response(p, db) for p in plans]


@router.post("/", response_model=StudyPlanResponse)
def create_plan(
    data: StudyPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new study plan."""
    if data.end_date < data.start_date:
        raise HTTPException(status_code=400, detail="结束日期不能早于开始日期")

    if data.daily_target > data.target_count:
        raise HTTPException(status_code=400, detail="每日目标不能超过总目标")

    plan = StudyPlan(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        target_type=data.target_type,
        target_material_id=data.target_material_id,
        target_count=data.target_count,
        daily_target=data.daily_target,
        duration_days=data.duration_days,
        start_date=data.start_date,
        end_date=data.end_date,
        icon=data.icon,
        color=data.color,
        status="active",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    # Initialize progress records
    current = data.start_date
    while current <= data.end_date:
        progress = StudyPlanProgress(
            plan_id=plan.id,
            progress_date=current,
            completed_count=0,
            target_count=data.daily_target,
            is_completed=False,
        )
        db.add(progress)
        current += timedelta(days=1)
    db.commit()

    return _to_response(plan, db)


@router.get("/{plan_id}", response_model=StudyPlanResponse)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single study plan by ID."""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="学习计划不存在")
    return _to_response(plan, db)


@router.put("/{plan_id}", response_model=StudyPlanResponse)
def update_plan(
    plan_id: int,
    data: StudyPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a study plan."""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="学习计划不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plan, key, value)

    db.commit()
    db.refresh(plan)
    return _to_response(plan, db)


@router.delete("/{plan_id}", response_model=dict)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a study plan."""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="学习计划不存在")
    db.delete(plan)
    db.commit()
    return {"message": "删除成功"}


@router.post("/{plan_id}/pause", response_model=StudyPlanResponse)
def pause_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """暂停学习计划"""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="学习计划不存在")
    if plan.status != "active":
        raise HTTPException(status_code=400, detail="只有进行中的计划才能暂停")
    plan.status = "paused"
    db.commit()
    db.refresh(plan)
    return _to_response(plan, db)


@router.post("/{plan_id}/resume", response_model=StudyPlanResponse)
def resume_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """恢复学习计划"""
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="学习计划不存在")
    if plan.status != "paused":
        raise HTTPException(status_code=400, detail="只有已暂停的计划才能恢复")
    plan.status = "active"
    db.commit()
    db.refresh(plan)
    return _to_response(plan, db)


@router.post("/{plan_id}/check-in")
def daily_check_in(
    plan_id: int,
    manual_count: int = 0,
    note: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """记录每日学习进度打卡。

    - 自动统计今日已完成的复习数（从 ReviewHistory 统计）
    - manual_count: 手动追加的数量（最大 10），用于记录线下学习
    - note: 手动打卡备注
    """
    plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="学习计划不存在")

    if manual_count < 0:
        raise HTTPException(status_code=400, detail="手动数量不能为负数")
    if manual_count > 10:
        raise HTTPException(status_code=400, detail="手动追加数量最大为 10")

    today = date.today()

    # 自动计算今日已完成的复习数（从 ReviewHistory 统计）
    auto_count = (
        db.query(func.count(ReviewHistory.id))
        .join(ReviewSchedule)
        .filter(
            ReviewSchedule.user_id == current_user.id,
            func.date(ReviewHistory.reviewed_at) == today
        )
        .scalar() or 0
    )

    # 总完成数 = 自动统计 + 手动追加
    total_completed = auto_count + manual_count

    # 查询或创建今日进度记录
    progress = db.query(StudyPlanProgress).filter(
        StudyPlanProgress.plan_id == plan_id,
        StudyPlanProgress.progress_date == today
    ).first()

    if not progress:
        progress = StudyPlanProgress(
            plan_id=plan_id,
            progress_date=today,
            target_count=plan.daily_target,
        )
        db.add(progress)

    progress.completed_count = total_completed
    progress.is_completed = total_completed >= plan.daily_target
    if note:
        progress.note = note

    # 检查计划是否完成
    if plan.status == "active":
        total_completed_days = db.query(StudyPlanProgress).filter(
            StudyPlanProgress.plan_id == plan_id,
            StudyPlanProgress.is_completed == True
        ).count()
        required_days = db.query(StudyPlanProgress).filter(
            StudyPlanProgress.plan_id == plan_id,
            StudyPlanProgress.progress_date <= today,
            StudyPlanProgress.progress_date >= plan.start_date
        ).count()
        if required_days > 0 and total_completed_days >= required_days * 0.9:
            plan.status = "completed"

    db.commit()
    return {
        "message": "打卡成功",
        "auto_count": auto_count,
        "manual_count": manual_count,
        "completed_count": progress.completed_count,
        "is_completed": progress.is_completed
    }


@router.post("/quick-templates")
def create_quick_template(
    template: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a plan from a quick-start template."""
    templates = {
        "exam-week": {
            "title": "期末冲刺计划",
            "description": "高强度复习 7 天，每天 30 张闪卡",
            "target_count": 210, "daily_target": 30, "duration_days": 7,
            "icon": "🔥", "color": "rose",
        },
        "monthly": {
            "title": "月度系统复习",
            "description": "稳扎稳打 30 天，每天 20 张闪卡",
            "target_count": 600, "daily_target": 20, "duration_days": 30,
            "icon": "📅", "color": "indigo",
        },
        "weekend": {
            "title": "周末强化计划",
            "description": "2 天专注，每天 50 张闪卡",
            "target_count": 100, "daily_target": 50, "duration_days": 2,
            "icon": "⚡", "color": "amber",
        },
        "newbie": {
            "title": "新手入门计划",
            "description": "轻松入门 14 天，每天 10 张闪卡",
            "target_count": 140, "daily_target": 10, "duration_days": 14,
            "icon": "🌱", "color": "emerald",
        },
    }

    if template not in templates:
        raise HTTPException(status_code=400, detail="模板不存在")

    t = templates[template]
    start = date.today()
    end = start + timedelta(days=t["duration_days"] - 1)

    data = StudyPlanCreate(
        title=t["title"], description=t["description"],
        target_count=t["target_count"], daily_target=t["daily_target"],
        duration_days=t["duration_days"], start_date=start, end_date=end,
        icon=t["icon"], color=t["color"],
    )
    return create_plan(data, db, current_user)