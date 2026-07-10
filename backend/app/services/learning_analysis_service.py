from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date, timedelta
import json
import logging
from pathlib import Path

from app.core.config import settings
from app.models.user import User
from app.models.knowledge import KnowledgePoint
from app.models.flashcard import Flashcard
from app.models.review import ReviewSchedule, ReviewHistory
from app.models.material import Material
from app.services.ai_service import _call_llm
# 改进 6：导入统一的 streak 计算服务，替代本地 _calculate_streak 函数
from app.services.streak_service import calculate_streak

logger = logging.getLogger(__name__)


def _load_prompt_template() -> str:
    """Load the learning analysis prompt template from disk."""
    template_path = Path(__file__).parent.parent / "prompts" / "learning_analysis.txt"
    try:
        return template_path.read_text(encoding="utf-8")
    except Exception:
        # Fallback minimal prompt
        return """你是学习教练。基于用户数据，给出 {analysis_type} 类型的分析。
用户数据：总知识点 {total_points}, 已掌握 {mastered_points}, 闪卡 {total_flashcards}, 连续 {study_streak} 天。
输出 JSON: { title, content, highlights, recommendations }"""


def aggregate_user_context(db: Session, user: User) -> dict:
    """Aggregate user's learning data into a context dict for the AI."""
    # Core counts
    total_points = db.query(KnowledgePoint).filter(KnowledgePoint.user_id == user.id).count()
    mastered_points = db.query(KnowledgePoint).filter(
        KnowledgePoint.user_id == user.id,
        KnowledgePoint.mastery_level >= 0.8
    ).count()
    mastery_rate = round((mastered_points / total_points * 100) if total_points > 0 else 0, 1)

    total_flashcards = db.query(Flashcard).filter(
        Flashcard.user_id == user.id, Flashcard.is_active == True
    ).count()

    today = date.today()
    today_review = db.query(ReviewSchedule).filter(
        ReviewSchedule.user_id == user.id,
        ReviewSchedule.next_review <= today
    ).count()

    # Streak
    # 改进 6：调用统一的 streak_service.calculate_streak，替代本地 _calculate_streak
    streak = calculate_streak(db, user.id)

    total_reviews = db.query(ReviewHistory).join(ReviewSchedule).filter(
        ReviewSchedule.user_id == user.id
    ).count()

    # Daily review history (last 7 days)
    daily_history = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        count = db.query(ReviewHistory).join(ReviewSchedule).filter(
            ReviewSchedule.user_id == user.id,
            func.date(ReviewHistory.reviewed_at) == d
        ).count()
        daily_history.append(f"{d.strftime('%m-%d')}:{count}")
    daily_review_history = ", ".join(daily_history)

    # Top mastered topics
    mastered_topics_rows = db.query(KnowledgePoint).filter(
        KnowledgePoint.user_id == user.id,
        KnowledgePoint.mastery_level >= 0.8
    ).order_by(KnowledgePoint.mastery_level.desc()).limit(5).all()
    mastered_topics = ", ".join([p.title for p in mastered_topics_rows]) or "（暂无）"

    # Weak points
    weak_rows = db.query(KnowledgePoint).filter(
        KnowledgePoint.user_id == user.id,
        KnowledgePoint.mastery_level < 0.5
    ).order_by(KnowledgePoint.mastery_level.asc()).limit(8).all()
    weak_points = ", ".join([
        f"{p.title}(掌握度{round(p.mastery_level * 100)}%)" for p in weak_rows
    ]) or "（暂无明显薄弱点）"

    # Material progress
    materials = db.query(Material).filter(
        Material.user_id == user.id,
        Material.status == "completed"
    ).all()
    material_progress = ", ".join([
        f"{m.title}({len(m.knowledge_points)}知识点)" for m in materials[:5]
    ]) or "（暂无）"

    return {
        "total_points": total_points,
        "mastered_points": mastered_points,
        "mastery_rate": mastery_rate,
        "total_flashcards": total_flashcards,
        "today_review_count": today_review,
        "study_streak": streak,
        "total_reviews": total_reviews,
        "daily_review_history": daily_review_history,
        "mastered_topics": mastered_topics,
        "weak_points": weak_points,
        "material_progress": material_progress,
    }


async def generate_learning_analysis(db: Session, user: User, analysis_type: str) -> dict:
    """Generate a learning analysis report of the specified type using AI."""
    # Validate type
    valid_types = {"diagnosis", "outline", "key_points", "weakness"}
    if analysis_type not in valid_types:
        return {
            "type": analysis_type,
            "title": "未知分析类型",
            "content": "不支持的分析类型",
            "highlights": [],
            "recommendations": [],
        }

    # Check if API key is configured
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "":
        return _get_fallback_analysis(analysis_type, db, user)

    # Aggregate context
    context = aggregate_user_context(db, user)

    # Build prompt from template
    template = _load_prompt_template()
    try:
        prompt = template.format(analysis_type=analysis_type, **context)
    except Exception:
        prompt = f"基于用户数据：{json.dumps(context, ensure_ascii=False)}，请生成 {analysis_type} 类型的分析。"

    # Call AI
    try:
        result = await _call_llm(prompt, "")
        return {
            "type": analysis_type,
            "title": result.get("title", _get_default_title(analysis_type)),
            "content": result.get("content", ""),
            "highlights": result.get("highlights", [])[:4],
            "recommendations": result.get("recommendations", [])[:3],
        }
    except Exception as e:
        logger.error(f"Learning analysis AI error: {e}")
        return _get_fallback_analysis(analysis_type, db, user)


def _get_default_title(analysis_type: str) -> str:
    titles = {
        "diagnosis": "学习情况诊断",
        "outline": "学习路径建议",
        "key_points": "核心要点总结",
        "weakness": "薄弱环节分析",
    }
    return titles.get(analysis_type, "学习分析")


def _get_fallback_analysis(analysis_type: str, db: Session, user: User) -> dict:
    """Return a non-AI fallback when API key is missing or call fails."""
    context = aggregate_user_context(db, user)

    if analysis_type == "diagnosis":
        return {
            "type": analysis_type,
            "title": "学习情况诊断",
            "content": f"当前共 {context['total_points']} 个知识点，已掌握 {context['mastered_points']} 个，掌握率 {context['mastery_rate']}%。已复习 {context['total_reviews']} 次，连续学习 {context['study_streak']} 天。整体进度稳步推进中，建议保持当前节奏。",
            "highlights": [
                {"icon": "target", "text": f"掌握率 {context['mastery_rate']}%"},
                {"icon": "flame", "text": f"连续学习 {context['study_streak']} 天"},
                {"icon": "zap", "text": f"累计复习 {context['total_reviews']} 次"},
            ],
            "recommendations": [
                {"title": "保持每日复习", "description": f"今日还有 {context['today_review_count']} 张闪卡待复习，建议在记忆曲线衰减前完成。"},
                {"title": "聚焦薄弱环节", "description": "优先攻克掌握度低于 50% 的知识点，能最快提升整体掌握率。"},
            ],
        }
    elif analysis_type == "outline":
        return {
            "type": analysis_type,
            "title": "学习路径建议",
            "content": "建议按以下顺序推进学习：1) 复习今日待巩固的闪卡 → 2) 深入理解薄弱知识点 → 3) 串联知识图谱 → 4) 通过自测验证掌握。",
            "highlights": [
                {"icon": "sparkles", "text": "今日待复习 " + str(context['today_review_count']) + " 张"},
                {"icon": "target", "text": "薄弱点优先攻克"},
            ],
            "recommendations": [
                {"title": "优先复习高频率错题", "description": "回顾最近错误率较高的闪卡，加深印象。"},
                {"title": "建立知识关联", "description": "在知识图谱中查看知识点之间的关联，建立系统化理解。"},
            ],
        }
    elif analysis_type == "key_points":
        topics = context["mastered_topics"] if context["mastered_topics"] != "（暂无）" else "暂未掌握任何知识点"
        return {
            "type": analysis_type,
            "title": "核心要点总结",
            "content": f"你已经掌握的核心要点：{topics}。建议定期回顾这些要点，防止遗忘。",
            "highlights": [
                {"icon": "star", "text": f"已掌握 {context['mastered_points']} 个要点"},
                {"icon": "award", "text": f"掌握率 {context['mastery_rate']}%"},
            ],
            "recommendations": [
                {"title": "回顾已掌握要点", "description": "每周花 10 分钟复习已掌握的知识点，加深长期记忆。"},
                {"title": "建立知识网络", "description": "通过知识图谱视图，把已掌握的要点串联起来。"},
            ],
        }
    else:  # weakness
        weak = context["weak_points"] if context["weak_points"] != "（暂无明显薄弱点）" else "暂无明显薄弱点"
        return {
            "type": analysis_type,
            "title": "薄弱环节分析",
            "content": f"当前薄弱知识点：{weak}。这些知识点是提升整体掌握率的关键。",
            "highlights": [
                {"icon": "trending-up", "text": f"掌握率 {context['mastery_rate']}%"},
                {"icon": "flame", "text": f"连续学习 {context['study_streak']} 天"},
            ],
            "recommendations": [
                {"title": "优先攻克薄弱点", "description": "每天花 15 分钟专门复习掌握度低于 50% 的知识点。"},
                {"title": "拆解复杂概念", "description": "把复杂知识点拆成小块，每掌握一个小块就标记一次。"},
            ],
        }
