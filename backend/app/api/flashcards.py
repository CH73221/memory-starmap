import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, Field
from typing import Optional
from app.core.database import get_db, get_db_session
from app.api.auth import get_current_user
from app.models.user import User
from app.models.flashcard import Flashcard
from app.models.knowledge import KnowledgePoint
from app.models.material import Material
from app.models.review import ReviewSchedule
from app.models.study_plan import StudyPlan
from app.schemas.flashcard import FlashcardResponse, ReviewRequest, TodayCardsResponse
from app.services.ai_service import generate_flashcards
from app.services.spaced_repetition import get_today_cards, update_after_review

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])


# ===== Schemas for manual CRUD =====

class FlashcardCreate(BaseModel):
    question: str
    answer: str
    knowledge_point_id: Optional[int] = None
    card_type: str = "qa"
    difficulty: int = Field(default=3, ge=1, le=5)


class FlashcardUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    card_type: Optional[str] = None
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)


async def generate_flashcards_for_material(material_id: int, user_id: int):
    """Background task to generate flashcards. Uses independent DB session."""
    try:
        with get_db_session() as db:
            points = db.query(KnowledgePoint).filter(
                KnowledgePoint.material_id == material_id,
                KnowledgePoint.user_id == user_id
            ).all()

            for point in points:
                cards = await generate_flashcards(point.title, point.content)
                for card_data in cards:
                    flashcard = Flashcard(
                        knowledge_point_id=point.id,
                        user_id=user_id,
                        question=card_data["question"],
                        answer=card_data["answer"],
                        card_type=card_data.get("card_type", "qa"),
                        difficulty=card_data.get("difficulty", 3)
                    )
                    db.add(flashcard)

            db.commit()
            logger.info(f"Flashcards generated for material_id={material_id}")
    except Exception as e:
        logger.error(f"Flashcard generation error for material_id={material_id}: {e}", exc_info=True)


@router.post("/generate/{material_id}")
async def generate(
    material_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate flashcards for a material."""
    material = db.query(Material).filter(
        Material.id == material_id,
        Material.user_id == current_user.id
    ).first()
    if not material:
        raise HTTPException(status_code=404, detail="资料不存在")

    background_tasks.add_task(generate_flashcards_for_material, material_id, current_user.id)
    return {"message": "闪卡生成已开始，请稍后刷新查看"}


@router.get("/", response_model=list[FlashcardResponse])
def list_flashcards(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all flashcards for current user."""
    flashcards = db.query(Flashcard).options(
        joinedload(Flashcard.knowledge_point)
    ).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.is_active == True
    ).order_by(Flashcard.created_at.desc()).all()

    result = []
    for f in flashcards:
        kp_title = f.knowledge_point.title if f.knowledge_point else None
        result.append(FlashcardResponse(
            id=f.id, question=f.question, answer=f.answer,
            card_type=f.card_type, difficulty=f.difficulty, knowledge_point_title=kp_title
        ))
    return result


@router.post("/", response_model=FlashcardResponse)
def create_flashcard(data: FlashcardCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Manually create a flashcard."""
    if data.knowledge_point_id:
        kp = db.query(KnowledgePoint).filter(
            KnowledgePoint.id == data.knowledge_point_id,
            KnowledgePoint.user_id == current_user.id
        ).first()
        if not kp:
            raise HTTPException(status_code=404, detail="知识点不存在")

    flashcard = Flashcard(
        knowledge_point_id=data.knowledge_point_id, user_id=current_user.id,
        question=data.question, answer=data.answer,
        card_type=data.card_type, difficulty=data.difficulty
    )
    db.add(flashcard)
    db.commit()
    db.refresh(flashcard)

    kp_title = flashcard.knowledge_point.title if flashcard.knowledge_point else None
    return FlashcardResponse(
        id=flashcard.id, question=flashcard.question, answer=flashcard.answer,
        card_type=flashcard.card_type, difficulty=flashcard.difficulty, knowledge_point_title=kp_title
    )


@router.put("/{flashcard_id}", response_model=FlashcardResponse)
def update_flashcard(flashcard_id: int, data: FlashcardUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Edit a flashcard."""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id, Flashcard.user_id == current_user.id
    ).first()
    if not flashcard:
        raise HTTPException(status_code=404, detail="闪卡不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(flashcard, key, value)

    db.commit()
    db.refresh(flashcard)

    kp_title = flashcard.knowledge_point.title if flashcard.knowledge_point else None
    return FlashcardResponse(
        id=flashcard.id, question=flashcard.question, answer=flashcard.answer,
        card_type=flashcard.card_type, difficulty=flashcard.difficulty, knowledge_point_title=kp_title
    )


@router.delete("/{flashcard_id}", response_model=dict)
def delete_flashcard(flashcard_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Soft delete a flashcard (set is_active=False)."""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id, Flashcard.user_id == current_user.id
    ).first()
    if not flashcard:
        raise HTTPException(status_code=404, detail="闪卡不存在")

    flashcard.is_active = False
    db.commit()
    return {"message": "删除成功"}


@router.get("/today", response_model=TodayCardsResponse)
def get_today(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get today's review cards."""
    data = get_today_cards(db, current_user.id)

    cards = []
    for f in data["cards"]:
        kp_title = f.knowledge_point.title if f.knowledge_point else None
        cards.append(FlashcardResponse(
            id=f.id, question=f.question, answer=f.answer,
            card_type=f.card_type, difficulty=f.difficulty, knowledge_point_title=kp_title
        ))

    from_plans = _get_related_plans(db, current_user.id, data["cards"])

    return TodayCardsResponse(
        cards=cards, total=data["total"], new_count=data["new_count"],
        review_count=data["review_count"], from_plans=from_plans
    )


def _get_related_plans(db: Session, user_id: int, today_cards: list) -> list[dict]:
    today = date.today()
    active_plans = db.query(StudyPlan).filter(
        StudyPlan.user_id == user_id, StudyPlan.status == "active",
        StudyPlan.start_date <= today, StudyPlan.end_date >= today
    ).all()

    if not active_plans or not today_cards:
        return []

    material_ids = set()
    knowledge_point_ids = set()
    for card in today_cards:
        if card.knowledge_point_id:
            knowledge_point_ids.add(card.knowledge_point_id)
            if card.knowledge_point and card.knowledge_point.material_id:
                material_ids.add(card.knowledge_point.material_id)

    related_plans = []
    for plan in active_plans:
        card_count = 0
        if plan.target_type == "flashcards" and plan.target_material_id is None:
            card_count = len(today_cards)
        elif plan.target_type == "material" and plan.target_material_id:
            if plan.target_material_id in material_ids:
                for card in today_cards:
                    if card.knowledge_point and card.knowledge_point.material_id == plan.target_material_id:
                        card_count += 1
        elif plan.target_type == "knowledge":
            if plan.target_material_id and plan.target_material_id in knowledge_point_ids:
                card_count = sum(1 for c in today_cards if c.knowledge_point_id == plan.target_material_id)

        if card_count > 0:
            related_plans.append({
                "plan_id": plan.id, "title": plan.title, "icon": plan.icon,
                "color": plan.color, "daily_target": plan.daily_target, "today_card_count": card_count,
            })

    return related_plans


@router.post("/{flashcard_id}/review")
def review_flashcard(
    flashcard_id: int, review_data: ReviewRequest,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Submit a review result for a flashcard."""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id, Flashcard.user_id == current_user.id
    ).first()
    if not flashcard:
        raise HTTPException(status_code=404, detail="闪卡不存在")

    schedule = db.query(ReviewSchedule).filter(ReviewSchedule.flashcard_id == flashcard_id).first()
    if not schedule:
        schedule = ReviewSchedule(flashcard_id=flashcard_id, user_id=current_user.id, next_review=date.today())
        db.add(schedule)
        db.flush()

    result = update_after_review(
        db, schedule.id, review_data.quality,
        combo=review_data.combo or 0,
        response_time_ms=review_data.response_time_ms,
    )

    if not result:
        raise HTTPException(status_code=500, detail="复习记录更新失败")

    return {
        "message": "复习记录已保存",
        "xp_earned": result["xp_earned"],
        "total_xp": result["total_xp"],
        "leveled_up": result["leveled_up"],
        "new_level": result["new_level"],
        "old_level": result["old_level"],
        "new_streak": result["new_streak"],
        "is_new_day": result["is_new_day"],
        "mistake_created": result["mistake_created"],
        "new_achievements": result["new_achievements"],
        "next_review": result["schedule"].next_review.isoformat(),
        "memory_strength": result["schedule"].memory_strength,
    }


@router.get("/weak", response_model=list[FlashcardResponse])
def get_weak_flashcards(limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """获取薄弱知识点的闪卡（掌握度 < 0.4）。"""
    weak_points = db.query(KnowledgePoint).filter(
        KnowledgePoint.user_id == current_user.id, KnowledgePoint.mastery_level < 0.4,
    ).order_by(KnowledgePoint.mastery_level.asc()).all()

    if not weak_points:
        return []

    weak_point_ids = [p.id for p in weak_points]
    flashcards = db.query(Flashcard).options(
        joinedload(Flashcard.knowledge_point)
    ).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.knowledge_point_id.in_(weak_point_ids),
        Flashcard.is_active == True,
    ).order_by(Flashcard.created_at.desc()).limit(limit).all()

    result = []
    for f in flashcards:
        kp_title = f.knowledge_point.title if f.knowledge_point else None
        result.append(FlashcardResponse(
            id=f.id, question=f.question, answer=f.answer,
            card_type=f.card_type, difficulty=f.difficulty, knowledge_point_title=kp_title,
        ))
    return result


@router.get("/review/knowledge/{knowledge_id}", response_model=list[FlashcardResponse])
def review_knowledge_flashcards(knowledge_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """复习指定知识点的所有闪卡。"""
    point = db.query(KnowledgePoint).filter(
        KnowledgePoint.id == knowledge_id, KnowledgePoint.user_id == current_user.id,
    ).first()
    if not point:
        raise HTTPException(status_code=404, detail="知识点不存在")

    flashcards = db.query(Flashcard).filter(
        Flashcard.knowledge_point_id == knowledge_id,
        Flashcard.user_id == current_user.id, Flashcard.is_active == True,
    ).order_by(Flashcard.created_at.desc()).all()

    result = []
    for f in flashcards:
        result.append(FlashcardResponse(
            id=f.id, question=f.question, answer=f.answer,
            card_type=f.card_type, difficulty=f.difficulty, knowledge_point_title=point.title,
        ))
    return result
