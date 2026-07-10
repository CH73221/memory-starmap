"""AI 聊天 API 路由 — 通用对话 + 学习分析"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.knowledge import KnowledgePoint
from app.models.flashcard import Flashcard
from app.models.review import ReviewSchedule, ReviewHistory
from app.services.ai_service import chat_with_context
from app.services.learning_analysis_service import generate_learning_analysis
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ChatRequest(BaseModel):
    message: str
    history: Optional[list[dict]] = []
    type: Optional[str] = None  # diagnosis/outline/key_points/weakness for analysis


class ChatResponse(BaseModel):
    reply: str
    is_fallback: bool = False


def _build_user_context(db: Session, user: User) -> dict:
    """Aggregate user learning data for AI context."""
    total_points = db.query(func.count(KnowledgePoint.id)).filter(
        KnowledgePoint.user_id == user.id
    ).scalar() or 0

    mastered_points = db.query(func.count(KnowledgePoint.id)).filter(
        KnowledgePoint.user_id == user.id,
        KnowledgePoint.mastery_level >= 0.8
    ).scalar() or 0

    total_flashcards = db.query(func.count(Flashcard.id)).filter(
        Flashcard.user_id == user.id,
        Flashcard.is_active == True
    ).scalar() or 0

    today_review = db.query(func.count(ReviewSchedule.id)).filter(
        ReviewSchedule.user_id == user.id,
        ReviewSchedule.next_review <= func.current_date()
    ).scalar() or 0

    total_reviews = db.query(func.count(ReviewHistory.id)).join(
        ReviewSchedule, ReviewSchedule.id == ReviewHistory.review_schedule_id
    ).filter(
        ReviewSchedule.user_id == user.id
    ).scalar() or 0

    # Mastered topics
    mastered_kps = db.query(KnowledgePoint.title).filter(
        KnowledgePoint.user_id == user.id,
        KnowledgePoint.mastery_level >= 0.8
    ).limit(10).all()
    mastered_topics = ", ".join([kp[0] for kp in mastered_kps]) if mastered_kps else "暂无"

    # Weak points
    weak_kps = db.query(KnowledgePoint.title).filter(
        KnowledgePoint.user_id == user.id,
        KnowledgePoint.mastery_level < 0.4
    ).limit(10).all()
    weak_points = ", ".join([kp[0] for kp in weak_kps]) if weak_kps else "暂无"

    # Daily review history (last 7 days)
    daily_reviews = db.query(
        func.date(ReviewHistory.reviewed_at).label("date"),
        func.count(ReviewHistory.id).label("count")
    ).join(
        ReviewSchedule, ReviewSchedule.id == ReviewHistory.review_schedule_id
    ).filter(
        ReviewSchedule.user_id == user.id,
        ReviewHistory.reviewed_at >= func.current_date() - 7
    ).group_by(func.date(ReviewHistory.reviewed_at)).order_by("date").all()

    daily_history = ", ".join([f"{r.date}:{r.count}次" for r in daily_reviews]) if daily_reviews else "暂无"

    streak = 0
    if daily_reviews:
        streak = len(daily_reviews)

    mastery_rate = round(mastered_points / total_points * 100, 1) if total_points > 0 else 0

    return {
        "total_points": total_points,
        "mastered_points": mastered_points,
        "mastery_rate": mastery_rate,
        "total_flashcards": total_flashcards,
        "today_review_count": today_review,
        "study_streak": streak,
        "total_reviews": total_reviews,
        "mastered_topics": mastered_topics,
        "weak_points": weak_points,
        "daily_review_history": daily_history,
    }


def _generate_fallback_response(message: str, context: dict) -> str:
    """Generate a smart contextual response when no AI API key is configured."""
    msg_lower = message.lower()

    # Greeting
    if any(w in msg_lower for w in ["你好", "hi", "hello", "嗨"]):
        return f"你好！我是你的 AI 学习助手。你目前有 {context['total_points']} 个知识点，掌握率 {context['mastery_rate']}%。今日还有 {context['today_review_count']} 张闪卡待复习。有什么我可以帮你的吗？"

    # Review advice
    if any(w in msg_lower for w in ["复习", "review", "怎么学", "怎么复习"]):
        if context['today_review_count'] > 0:
            return f"根据你的学习数据，今天有 {context['today_review_count']} 张闪卡需要复习。建议优先复习薄弱知识点：{context['weak_points']}。使用间隔重复法，先复习难度高的卡片，保持每张卡片 3-5 秒的快速判断节奏。"
        return f"你今天没有待复习的闪卡，做得很好！当前掌握率 {context['mastery_rate']}%，继续保持学习节奏。建议上传新的学习资料来扩展知识网络。"

    # Mastery analysis
    if any(w in msg_lower for w in ["掌握", "mastery", "进度", "情况"]):
        return f"当前学习概况：\n• 总知识点 {context['total_points']} 个，已掌握 {context['mastered_points']} 个（{context['mastery_rate']}%）\n• 闪卡 {context['total_flashcards']} 张\n• 累计复习 {context['total_reviews']} 次\n• 连续学习 {context['study_streak']} 天\n\n已掌握要点：{context['mastered_topics']}\n薄弱知识点：{context['weak_points']}\n\n建议：集中精力攻克薄弱知识点，同时保持每日复习节奏巩固已掌握内容。"

    # Plan
    if any(w in msg_lower for w in ["计划", "plan", "安排", "目标"]):
        return f"基于你的学习数据，建议制定如下计划：\n1. 每日复习 {min(context['today_review_count'], 20)} 张闪卡\n2. 重点攻克薄弱知识点：{context['weak_points']}\n3. 每周上传 1-2 份新资料扩展知识面\n4. 保持连续学习（当前已连续 {context['study_streak']} 天）"

    # Weakness
    if any(w in msg_lower for w in ["薄弱", "weak", "差", "不好"]):
        if context['weak_points'] == "暂无":
            return "目前没有明显的薄弱知识点，你的整体掌握情况良好！继续保持复习节奏即可。"
        return f"你的薄弱知识点有：{context['weak_points']}\n\n建议：\n1. 针对这些知识点增加复习频率\n2. 尝试用记忆宫殿建立关联记忆\n3. 制作更多闪卡加强练习\n4. 在 AI 助手中选择「薄弱分析」获取详细建议"

    # Default
    return f"我理解你想了解「{message}」。目前你掌握率 {context['mastery_rate']}%，今日待复习 {context['today_review_count']} 张闪卡。你可以问我关于复习策略、学习计划、薄弱知识点分析等问题，或者使用快捷按钮获取详细的学习诊断报告。\n\n💡 提示：配置 AI API Key 后可获得更智能的对话体验。请在 .env 文件中设置 OPENAI_API_KEY。"


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI 聊天 — 支持自由对话和学习分析两种模式。

    - 如果 type 不为空，调用学习分析服务（diagnosis/outline/key_points/weakness）
    - 如果 type 为空，调用通用 AI 对话（需 OPENAI_API_KEY，否则走智能 fallback）
    """
    # Analysis mode
    if req.type and req.type in ("diagnosis", "outline", "key_points", "weakness"):
        try:
            result = await generate_learning_analysis(db, current_user, req.type)
            return ChatResponse(reply=result.get("content", "分析完成，但无内容返回"), is_fallback=result.get("is_fallback", False))
        except Exception as e:
            logger.error(f"Learning analysis failed: {e}")
            raise HTTPException(status_code=500, detail="学习分析服务暂时不可用")

    # General chat mode
    context = _build_user_context(db, current_user)

    # Try real AI if API key is configured
    if settings.OPENAI_API_KEY:
        try:
            reply = await chat_with_context(req.message, req.history, context)
            return ChatResponse(reply=reply, is_fallback=False)
        except Exception as e:
            logger.error(f"AI chat failed: {e}, falling back to local response")

    # Fallback: generate contextual response from user data
    reply = _generate_fallback_response(req.message, context)
    return ChatResponse(reply=reply, is_fallback=True)


@router.get("/status")
async def ai_status(current_user: User = Depends(get_current_user)):
    """Check if AI API is configured."""
    return {
        "ai_enabled": bool(settings.OPENAI_API_KEY),
        "model": settings.AI_MODEL if settings.OPENAI_API_KEY else None,
        "provider": "SiliconFlow" if "siliconflow" in settings.OPENAI_BASE_URL else "OpenAI-compatible",
    }
