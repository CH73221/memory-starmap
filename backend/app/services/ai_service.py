import httpx
import json
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


async def _call_llm(prompt: str, system_prompt: str = "") -> dict:
    """Call LLM API and return parsed JSON response."""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": settings.AI_MODEL,
                "messages": messages,
                "temperature": 0.3,
                "response_format": {"type": "json_object"}
            },
            timeout=60.0
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return json.loads(content)


async def chat_with_context(
    user_message: str,
    chat_history: list = None,
    user_context: dict = None,
) -> str:
    """General-purpose chat with LLM, injecting user learning context.

    Args:
        user_message: The user's free-text question
        chat_history: Previous messages [{role, content}, ...]
        user_context: Aggregated learning data dict for personalization

    Returns:
        AI response text
    """
    context_str = ""
    if user_context:
        context_str = f"""当前用户学习数据：
- 总知识点: {user_context.get('total_points', 0)}
- 已掌握: {user_context.get('mastered_points', 0)} (掌握率 {user_context.get('mastery_rate', 0)}%)
- 闪卡总数: {user_context.get('total_flashcards', 0)}
- 今日待复习: {user_context.get('today_review_count', 0)}
- 连续学习: {user_context.get('study_streak', 0)} 天
- 累计复习: {user_context.get('total_reviews', 0)} 次
- 已掌握要点: {user_context.get('mastered_topics', '暂无')}
- 薄弱知识点: {user_context.get('weak_points', '暂无')}
- 近7天复习: {user_context.get('daily_review_history', '暂无')}
"""

    system_prompt = f"""你是「记忆星图」的 AI 学习助手。你帮助用户分析学习数据、制定复习计划、解答学习问题。
你的回答应该简洁、专业、有针对性，使用中文回答。
请基于用户的学习数据给出个性化建议，而不是泛泛而谈。

{context_str}"""

    messages = [{"role": "system", "content": system_prompt}]

    # Add chat history (last 6 messages for context window)
    if chat_history:
        for msg in chat_history[-6:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

    messages.append({"role": "user", "content": user_message})

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": settings.AI_MODEL,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1024,
            },
            timeout=60.0
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def extract_knowledge(text: str) -> dict:
    """Extract knowledge points and relations from text using AI."""
    system_prompt = """你是一位教育专家。请分析课程笔记内容，提取核心知识点。
要求：
1. 提取 5-20 个核心知识点（根据内容量决定）
2. 为每个知识点提供：标题、详细内容、重要程度(1-5)
3. 标注知识点之间的关系（prerequisite=前置知识, related=相关, part_of=包含, contrasts=对比）
4. 输出严格 JSON 格式"""

    prompt = f"""请分析以下课程笔记内容，提取知识点和关系：

{text[:8000]}

请输出以下JSON格式：
{{
  "knowledge_points": [
    {{
      "title": "知识点标题",
      "content": "知识点详细内容",
      "importance": 4
    }}
  ],
  "relations": [
    {{
      "source_title": "源知识点标题",
      "target_title": "目标知识点标题",
      "relation_type": "prerequisite|related|part_of|contrasts",
      "description": "关系描述"
    }}
  ],
  "summary": "内容摘要"
}}"""

    try:
        return await _call_llm(prompt, system_prompt)
    except Exception as e:
        logger.error(f"AI extraction error: {e}")
        return {
            "knowledge_points": [],
            "relations": [],
            "summary": "AI处理失败，请重试"
        }


async def generate_flashcards(title: str, content: str) -> list:
    """Generate flashcards for a knowledge point."""
    system_prompt = """你是一位教育专家。请根据知识点生成复习闪卡。
要求：
1. 生成 2-4 张不同类型的闪卡
2. 类型包括：fill_blank（填空题）、qa（问答题）、definition（定义题）
3. 问题清晰明确，答案准确简洁
4. 难度标注 1-5"""

    prompt = f"""知识点：{title}
内容：{content}

请输出JSON格式：
{{
  "flashcards": [
    {{
      "question": "问题内容",
      "answer": "答案内容",
      "card_type": "fill_blank|qa|definition",
      "difficulty": 3
    }}
  ]
}}"""

    try:
        result = await _call_llm(prompt, system_prompt)
        return result.get("flashcards", [])
    except Exception as e:
        logger.error(f"Flashcard generation error: {e}")
        return []
