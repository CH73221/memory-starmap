from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
import hashlib
import random

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.flashcard import Flashcard
from app.models.extra import Mistake, FocusSession, MistakeKnowledgeRelation
from app.models.review import ReviewHistory, ReviewSchedule
from app.models.knowledge import KnowledgePoint
from app.schemas.extra import (
    MistakeCreate, MistakeResponse, MistakeListResponse,
    MistakeReviewRequest, MistakeReviewResponse, MistakeStatsResponse,
    WeaknessRadarResponse, FocusSessionCreate, FocusSessionResponse,
    FocusStatsResponse, LeaderboardEntry, LeaderboardResponse,
    AchievementResponse, AchievementListResponse,
)
# 改进 1/P0 + 改进 6：导入统一的 streak 计算服务，替代直接访问 user.study_streak 属性
from app.services.streak_service import calculate_streak
from app.services import achievement_service

router = APIRouter()

# 虚拟用户种子数据
VIRTUAL_USERS = [
    {"name": "张明轩", "avatar": "🦊", "grade": "大三", "major": "计算机"},
    {"name": "李诗琪", "avatar": "🌸", "grade": "大二", "major": "临床医学"},
    {"name": "王浩然", "avatar": "🚀", "grade": "大四", "major": "电子工程"},
    {"name": "陈晓萌", "avatar": "🌺", "grade": "大一", "major": "金融学"},
    {"name": "刘宇轩", "avatar": "⚡", "grade": "大三", "major": "物理学"},
    {"name": "黄思涵", "avatar": "🦋", "grade": "大二", "major": "心理学"},
    {"name": "赵晨阳", "avatar": "🌟", "grade": "研一", "major": "人工智能"},
    {"name": "吴静怡", "avatar": "🌷", "grade": "大三", "major": "法学"},
    {"name": "周子轩", "avatar": "🎯", "grade": "大二", "major": "数学"},
    {"name": "徐若曦", "avatar": "🌹", "grade": "大四", "major": "建筑学"},
    {"name": "孙志豪", "avatar": "🔥", "grade": "大三", "major": "机械工程"},
    {"name": "马雅婷", "avatar": "✨", "grade": "大一", "major": "英语"},
    {"name": "朱天宇", "avatar": "🌌", "grade": "研二", "major": "化学"},
    {"name": "胡欣怡", "avatar": "🌻", "grade": "大二", "major": "新闻"},
    {"name": "林俊杰", "avatar": "🎨", "grade": "大三", "major": "设计学"},
    {"name": "何雨萱", "avatar": "🌿", "grade": "大四", "major": "生物学"},
    {"name": "高云飞", "avatar": "🛸", "grade": "研一", "major": "天文学"},
    {"name": "罗雅琪", "avatar": "🦄", "grade": "大二", "major": "经济学"},
    {"name": "宋嘉伟", "avatar": "🎓", "grade": "大三", "major": "哲学"},
    {"name": "韩梦瑶", "avatar": "🌙", "grade": "大一", "major": "化学"},
    {"name": "冯思源", "avatar": "🌟", "grade": "大四", "major": "地理"},
    {"name": "邓佳怡", "avatar": "🍀", "grade": "大二", "major": "音乐"},
    {"name": "曹志远", "avatar": "🌊", "grade": "大三", "major": "海洋学"},
    {"name": "彭丽君", "avatar": "🌻", "grade": "研一", "major": "历史"},
    {"name": "曾子默", "avatar": "🎭", "grade": "大二", "major": "戏剧"},
    {"name": "田雨欣", "avatar": "🌈", "grade": "大三", "major": "教育"},
    {"name": "杜浩然", "avatar": "🛤️", "grade": "大四", "major": "土木"},
    {"name": "黎安琪", "avatar": "🌸", "grade": "大一", "major": "护理"},
    {"name": "袁梦瑶", "avatar": "🌺", "grade": "研二", "major": "材料"},
]


def _deterministic_hash(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)


def generate_virtual_activity(user_name: str, seed: int):
    """基于名字生成稳定的虚拟学习活动数据"""
    random.seed(_deterministic_hash(user_name) + seed)
    today = random.randint(0, 60)
    week = today + random.randint(20, 100)
    total = week + random.randint(300, 1200)
    streak = random.randint(0, 45)
    return {
        "today_reviews": today,
        "week_reviews": week,
        "total_reviews": total,
        "streak": streak,
    }


def diagnose_mistake(question: str, user_answer: str | None, correct_answer: str) -> dict:
    """AI 诊断错题原因 - 简化规则"""
    if not user_answer:
        return {
            "diagnosis": "memory_decay",
            "explanation": f"你对「{question[:30]}」完全没有记忆痕迹。\n\n建议：先理解核心概念，再用记忆宫殿或图像记忆法强化印象。今天内复习 3 次，明日复习 1 次，3 日后再复习 1 次巩固。",
        }
    # 简化判断逻辑
    ua_lower = user_answer.lower().strip()
    ca_lower = correct_answer.lower().strip()
    if ua_lower == ca_lower:
        return {
            "diagnosis": "careless",
            "explanation": f"答案接近但不完全正确。\n\n这通常是粗心造成的——你已掌握知识点，只是表达时遗漏了关键细节。建议：再仔细审题，慢一点，不要抢答。",
        }
    # 简单的相似度判断
    common = set(ua_lower) & set(ca_lower)
    if len(common) > 0:
        return {
            "diagnosis": "concept_misunderstanding",
            "explanation": f"你的答案「{user_answer[:40]}」与正确答案「{correct_answer[:40]}」有部分重合，说明你对概念有印象但理解偏差。\n\n建议：重新查阅相关定义，对比相似概念的区别，用自己的话复述一遍。",
        }
    return {
        "diagnosis": "memory_decay",
        "explanation": f"你提交的「{user_answer[:40] or '空'}」与正确答案「{correct_answer[:40]}」差距较大。\n\n这说明该知识点在你脑中已接近遗忘。建议：立即复习相关章节，建立知识连接，24 小时内再次复习。",
    }


# ============== Mistake Endpoints ==============
@router.post("/api/mistakes", response_model=MistakeResponse)
def create_mistake(
    payload: MistakeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """提交错题，自动 AI 诊断"""
    # 安全修复（IDOR）：校验 flashcard_id 与 related_knowledge_ids 均属于当前用户
    if payload.flashcard_id is not None:
        flashcard = db.query(Flashcard).filter(Flashcard.id == payload.flashcard_id).first()
        if not flashcard:
            raise HTTPException(404, "闪卡不存在")
        if flashcard.user_id != current_user.id:
            raise HTTPException(403, "无权操作该闪卡")

    if payload.related_knowledge_ids:
        owned_kp_ids = {
            kp.id for kp in db.query(KnowledgePoint)
            .filter(
                KnowledgePoint.id.in_(payload.related_knowledge_ids),
                KnowledgePoint.user_id == current_user.id,
            )
            .all()
        }
        for kp_id in payload.related_knowledge_ids:
            if kp_id not in owned_kp_ids:
                raise HTTPException(403, "无权操作该知识点")

    # 如果没传诊断结果，自动分析
    if not payload.ai_explanation:
        diag = diagnose_mistake(payload.question, payload.user_answer, payload.correct_answer)
        diagnosis = diag["diagnosis"]
        explanation = diag["explanation"]
    else:
        diagnosis = payload.diagnosis or "memory_decay"
        explanation = payload.ai_explanation

    related_ids = ",".join(str(i) for i in (payload.related_knowledge_ids or []))

    mistake = Mistake(
        user_id=current_user.id,
        flashcard_id=payload.flashcard_id,
        question=payload.question,
        user_answer=payload.user_answer,
        correct_answer=payload.correct_answer,
        diagnosis=diagnosis,
        ai_explanation=explanation,
        related_knowledge_ids=related_ids,
    )
    db.add(mistake)
    db.flush()

    # 建立多对多关联
    for kp_id in (payload.related_knowledge_ids or []):
        relation = MistakeKnowledgeRelation(
            mistake_id=mistake.id,
            knowledge_id=kp_id,
        )
        db.add(relation)

    db.commit()
    db.refresh(mistake)
    return mistake


@router.get("/api/mistakes", response_model=MistakeListResponse)
def list_mistakes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_resolved: bool = False,
):
    """获取错题列表"""
    q = db.query(Mistake).filter(Mistake.user_id == current_user.id)
    if not include_resolved:
        q = q.filter(Mistake.resolved == False)
    mistakes = q.order_by(desc(Mistake.created_at)).limit(100).all()
    total = db.query(Mistake).filter(Mistake.user_id == current_user.id).count()
    unresolved = db.query(Mistake).filter(Mistake.user_id == current_user.id, Mistake.resolved == False).count()

    # 按诊断类型聚合
    by_diag = {"memory_decay": 0, "concept_misunderstanding": 0, "careless": 0, "unknown": 0}
    all_mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id).all()
    for m in all_mistakes:
        d = m.diagnosis or "unknown"
        by_diag[d] = by_diag.get(d, 0) + 1

    return {"items": mistakes, "total": total, "unresolved": unresolved, "by_diagnosis": by_diag}


# ===== 任务1.2: 错题专项复习接口 =====
@router.get("/api/mistakes/review")
def get_mistakes_for_review(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
):
    """获取待复习的错题列表（未解决的错题，按时间排序）"""
    mistakes = db.query(Mistake).filter(
        Mistake.user_id == current_user.id,
        Mistake.resolved == False,
    ).order_by(
        Mistake.correct_count.asc(),  # 答对次数少的排前面
        desc(Mistake.created_at),     # 最新的排前面
    ).limit(limit).all()

    # 构造带知识点信息的响应
    result = []
    for m in mistakes:
        # 获取关联知识点标题
        knowledge_titles = []
        if m.related_knowledge_ids:
            kp_ids = [int(k.strip()) for k in m.related_knowledge_ids.split(",") if k.strip().isdigit()]
            if kp_ids:
                kps = db.query(KnowledgePoint).filter(KnowledgePoint.id.in_(kp_ids)).all()
                knowledge_titles = [kp.title for kp in kps]

        result.append({
            "id": m.id,
            "flashcard_id": m.flashcard_id,
            "question": m.question,
            "correct_answer": m.correct_answer,
            "diagnosis": m.diagnosis,
            "ai_explanation": m.ai_explanation,
            "correct_count": m.correct_count,
            "created_at": m.created_at.isoformat(),
            "knowledge_titles": knowledge_titles,
        })

    return {
        "items": result,
        "total": len(result),
        "unresolved_total": db.query(Mistake).filter(
            Mistake.user_id == current_user.id, Mistake.resolved == False
        ).count(),
    }


@router.post("/api/mistakes/{mistake_id}/review", response_model=MistakeReviewResponse)
def review_mistake(
    mistake_id: int,
    payload: MistakeReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    提交错题复习结果。
    - 答对 2 次后自动标记为已解决
    - 答错则重置 correct_count 为 0
    """
    mistake = db.query(Mistake).filter(
        Mistake.id == mistake_id,
        Mistake.user_id == current_user.id,
    ).first()
    if not mistake:
        raise HTTPException(404, "错题不存在")

    if mistake.resolved:
        raise HTTPException(400, "该错题已解决")

    if payload.correct:
        mistake.correct_count += 1
        # 答对 2 次自动标记为已解决
        if mistake.correct_count >= 2:
            mistake.resolved = True
            mistake.resolved_at = datetime.now(timezone.utc)
    else:
        # 答错重置计数
        mistake.correct_count = 0

    db.commit()
    db.refresh(mistake)

    # 检查错题克星成就
    resolved_count = db.query(Mistake).filter(
        Mistake.user_id == current_user.id,
        Mistake.resolved == True,
    ).count()
    achievement_service.check_achievements(db, current_user.id, {
        "mistakes_solved": resolved_count,
    })

    return MistakeReviewResponse(
        mistake_id=mistake.id,
        correct=payload.correct,
        correct_count=mistake.correct_count,
        resolved=mistake.resolved,
        resolved_at=mistake.resolved_at,
    )


@router.get("/api/mistakes/stats", response_model=MistakeStatsResponse)
def mistake_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """错题统计（总数、未解决数、按诊断分类统计）"""
    today = date.today()

    total = db.query(Mistake).filter(Mistake.user_id == current_user.id).count()
    unresolved = db.query(Mistake).filter(
        Mistake.user_id == current_user.id, Mistake.resolved == False
    ).count()
    resolved = total - unresolved

    # 今日新增
    today_added = db.query(Mistake).filter(
        Mistake.user_id == current_user.id,
        func.date(Mistake.created_at) == today,
    ).count()

    # 今日解决
    today_resolved = db.query(Mistake).filter(
        Mistake.user_id == current_user.id,
        Mistake.resolved == True,
        func.date(Mistake.resolved_at) == today,
    ).count()

    # 按诊断类型统计
    by_diag = {"memory_decay": 0, "concept_misunderstanding": 0, "careless": 0, "unknown": 0}
    all_mistakes = db.query(Mistake).filter(Mistake.user_id == current_user.id).all()
    for m in all_mistakes:
        d = m.diagnosis or "unknown"
        by_diag[d] = by_diag.get(d, 0) + 1

    return MistakeStatsResponse(
        total=total,
        unresolved=unresolved,
        resolved=resolved,
        by_diagnosis=by_diag,
        today_added=today_added,
        today_resolved=today_resolved,
    )


@router.post("/api/mistakes/{mistake_id}/resolve")
def resolve_mistake(
    mistake_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """标记错题已解决"""
    m = db.query(Mistake).filter(Mistake.id == mistake_id, Mistake.user_id == current_user.id).first()
    if not m:
        raise HTTPException(404, "错题不存在")
    m.resolved = True
    m.resolved_at = datetime.now(timezone.utc)
    db.commit()

    # 检查错题克星成就
    resolved_count = db.query(Mistake).filter(
        Mistake.user_id == current_user.id,
        Mistake.resolved == True,
    ).count()
    achievement_service.check_achievements(db, current_user.id, {
        "mistakes_solved": resolved_count,
    })

    return {"status": "ok"}


@router.delete("/api/mistakes/{mistake_id}", response_model=dict)
def delete_mistake(
    mistake_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    m = db.query(Mistake).filter(Mistake.id == mistake_id, Mistake.user_id == current_user.id).first()
    if not m:
        raise HTTPException(404, "错题不存在")
    db.delete(m)
    db.commit()
    return {"message": "删除成功"}


@router.get("/api/mistakes/weakness-radar", response_model=WeaknessRadarResponse)
def weakness_radar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """薄弱点雷达 - 从错题聚合最薄弱知识点"""
    mistakes = db.query(Mistake).filter(
        Mistake.user_id == current_user.id, Mistake.resolved == False
    ).all()
    if not mistakes:
        return {"knowledge_ids": [], "labels": [], "counts": [], "total_mistakes": 0}

    knowledge_count: dict[int, int] = {}
    knowledge_title: dict[int, str] = {}
    for m in mistakes:
        if not m.related_knowledge_ids:
            continue
        for kid_str in m.related_knowledge_ids.split(","):
            kid_str = kid_str.strip()
            if not kid_str:
                continue
            try:
                kid = int(kid_str)
            except ValueError:
                continue
            knowledge_count[kid] = knowledge_count.get(kid, 0) + 1
            if kid not in knowledge_title:
                kp = db.query(KnowledgePoint).filter(KnowledgePoint.id == kid).first()
                if kp:
                    knowledge_title[kid] = kp.title[:20]

    sorted_items = sorted(knowledge_count.items(), key=lambda x: -x[1])[:8]
    return {
        "knowledge_ids": [k for k, _ in sorted_items],
        "labels": [knowledge_title.get(k, f"知识点 #{k}") for k, _ in sorted_items],
        "counts": [c for _, c in sorted_items],
        "total_mistakes": len(mistakes),
    }


# ============== Focus Session Endpoints ==============
@router.post("/api/focus/sessions", response_model=FocusSessionResponse)
def create_focus_session(
    payload: FocusSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 安全修复：xp_earned 不再信任客户端传入，改由服务端根据专注时长计算
    # 完成的会话按每分钟 2 XP 计算，未完成按每分钟 1 XP 计算
    if payload.completed:
        xp_earned = payload.duration_minutes * 2
    else:
        xp_earned = payload.duration_minutes

    session = FocusSession(
        user_id=current_user.id,
        duration_minutes=payload.duration_minutes,
        ambient_sound=payload.ambient_sound,
        completed=payload.completed,
        xp_earned=xp_earned,
        started_at=datetime.now(timezone.utc),
        ended_at=datetime.now(timezone.utc) if payload.completed else None,
        notes=payload.notes,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 如果完成了，增加 XP 并检查成就
    if payload.completed:
        from app.services import xp_service
        xp_service.add_xp(db, current_user.id, xp_earned, source="focus")

        # 累计专注时间
        total_minutes = db.query(FocusSession).filter(
            FocusSession.user_id == current_user.id,
            FocusSession.completed == True,
        ).all()
        total_focus = sum(s.duration_minutes for s in total_minutes)
        achievement_service.check_achievements(db, current_user.id, {
            "focus_minutes": total_focus,
        })

    return session


@router.get("/api/focus/sessions", response_model=list[FocusSessionResponse])
def list_focus_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
):
    return db.query(FocusSession).filter(
        FocusSession.user_id == current_user.id
    ).order_by(desc(FocusSession.started_at)).limit(limit).all()


@router.get("/api/focus/stats", response_model=FocusStatsResponse)
def focus_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    week_ago = today - timedelta(days=7)
    sessions = db.query(FocusSession).filter(FocusSession.user_id == current_user.id, FocusSession.completed == True).all()

    today_minutes = sum(s.duration_minutes for s in sessions if s.started_at.date() == today)
    week_minutes = sum(s.duration_minutes for s in sessions if s.started_at.date() >= week_ago)
    today_count = sum(1 for s in sessions if s.started_at.date() == today)
    total_xp = sum(s.xp_earned for s in sessions)

    # 计算最长连续天数
    dates = sorted({s.started_at.date() for s in sessions})
    longest = 0
    cur = 0
    prev = None
    for d in dates:
        if prev and (d - prev).days == 1:
            cur += 1
        else:
            cur = 1
        longest = max(longest, cur)
        prev = d

    return {
        "today_minutes": today_minutes,
        "today_sessions": today_count,
        "week_minutes": week_minutes,
        "total_sessions": len(sessions),
        "longest_streak_days": longest,
        "total_xp": total_xp,
    }


# ============== Achievement Endpoints ==============
@router.get("/api/achievements", response_model=AchievementListResponse)
def get_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取用户成就列表（全部成就 + 解锁状态）"""
    all_achievements = achievement_service.get_user_achievements(db, current_user.id)
    unlocked_count = sum(1 for a in all_achievements if a["unlocked"])

    return AchievementListResponse(
        items=all_achievements,
        total=len(all_achievements),
        unlocked_count=unlocked_count,
    )


@router.get("/api/achievements/unlocked")
def get_unlocked_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取已解锁成就"""
    unlocked = achievement_service.get_unlocked_achievements(db, current_user.id)
    return {
        "items": unlocked,
        "total": len(unlocked),
    }


# ============== Leaderboard Endpoint ==============
@router.get("/api/leaderboard", response_model=LeaderboardResponse)
def leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = "today",  # today / week / total
):
    """排行榜：30 个虚拟用户 + 当前真实用户"""
    # 当前用户的真实数据
    # Bug 修复：ReviewHistory 模型没有 user_id 字段，需通过 ReviewSchedule 关联查询
    today = date.today()
    week_ago = today - timedelta(days=7)
    user_reviews = (
        db.query(ReviewHistory)
        .join(ReviewSchedule)
        .filter(ReviewSchedule.user_id == current_user.id)
        .all()
    )
    if period == "today":
        you_value = sum(1 for r in user_reviews if r.reviewed_at.date() == today)
    elif period == "week":
        you_value = sum(1 for r in user_reviews if r.reviewed_at.date() >= week_ago)
    else:
        you_value = len(user_reviews)
    you_total = len(user_reviews)
    # 改进 1/P0 Bug 修复：原代码访问 current_user.study_streak 会触发 AttributeError，
    # 因为 User 模型中没有 study_streak 字段。改用 streak_service 动态计算连续天数。
    # 改进 6：统一调用 streak_service.calculate_streak，消除重复实现。
    you_streak = calculate_streak(db, current_user.id)

    # 周期标签
    period_labels = {"today": "今日", "week": "本周", "total": "总榜"}
    period_label = period_labels.get(period, "今日")

    entries: list[LeaderboardEntry] = []
    seed = {"today": 1, "week": 2, "total": 3}[period]

    # 虚拟用户
    for u in VIRTUAL_USERS:
        activity = generate_virtual_activity(u["name"], seed)
        value = activity[f"{period}_reviews"] if period in activity else activity["total_reviews"]
        entries.append(LeaderboardEntry(
            rank=0,
            username=u["name"],
            avatar=u["avatar"],
            grade=u["grade"],
            major=u["major"],
            today_reviews=activity["today_reviews"],
            week_reviews=activity["week_reviews"],
            total_reviews=activity["total_reviews"],
            streak=activity["streak"],
        ))

    # 加入当前用户
    entries.append(LeaderboardEntry(
        rank=0,
        username=current_user.username,
        avatar="🌟",
        grade="我",
        major="当前用户",
        today_reviews=sum(1 for r in user_reviews if r.reviewed_at.date() == today),
        week_reviews=sum(1 for r in user_reviews if r.reviewed_at.date() >= week_ago),
        total_reviews=you_total,
        streak=you_streak,
        is_you=True,
    ))

    # 按 value 排序
    entries.sort(key=lambda e: (
        e.today_reviews if period == "today" else (e.week_reviews if period == "week" else e.total_reviews)
    ), reverse=True)

    for i, e in enumerate(entries):
        e.rank = i + 1

    # 计算当前用户排名和百分位
    your_entry = next((e for e in entries if e.is_you), entries[-1])
    your_rank = your_entry.rank
    your_pct = round((1 - (your_rank - 1) / len(entries)) * 100, 1)

    return {
        "entries": entries,
        "your_rank": your_rank,
        "your_percentile": max(your_pct, 0),
        "period": period,
        "period_label": period_label,
    }


# ============== Sample Data Endpoint ==============
@router.post("/api/sample-data")
async def populate_sample_data_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """一键填充全面的示例数据（学习资料、知识点、闪卡、复习计划、错题、专注会话、笔记、成就等）"""
    from app.services.sample_data_service import populate_sample_data
    result = populate_sample_data(db, current_user.id)
    return result
