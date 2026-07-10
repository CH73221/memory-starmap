import re
from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.note import Note
from app.schemas.note import (
    NoteCreate, NoteUpdate, NoteResponse, NoteListItem, NoteListResponse,
    BacklinkItem, NoteGraphNode, NoteGraphLink, NotesGraphResponse,
)
from app.services import achievement_service

router = APIRouter()

# 匹配 [[标题]] 或 [[标题|别名]] 或 [[标题#锚点]]
WIKI_LINK_RE = re.compile(r"\[\[([^\[\]\|#]+?)(?:\|[^\[\]]+?)?(?:#[^\[\]|]+?)?\]\]")


def extract_links(content: str) -> list[str]:
    """提取所有 [[X]] 中的目标标题"""
    return [m.group(1).strip() for m in WIKI_LINK_RE.finditer(content or "")]


def extract_tags(content: str) -> str:
    """提取 #tag 标签（用逗号分隔存储）"""
    # 跳过代码块
    cleaned = re.sub(r"```[\s\S]*?```", "", content or "")
    cleaned = re.sub(r"`[^`\n]*`", "", cleaned)
    tags = set()
    for m in re.finditer(r"(?:^|\s)#([A-Za-z0-9_/\-]+)", cleaned):
        tags.add(m.group(1))
    return ",".join(sorted(tags))


def extract_snippet(content: str, target: str, ctx: int = 60) -> str:
    """提取链接周围的上下文片段"""
    pattern_a = f"[[{target}]]"
    pattern_b = f"[[{target}|"
    idx = content.find(pattern_a)
    if idx == -1:
        idx = content.find(pattern_b)
        if idx == -1:
            return ""
        # 找 | 后的部分
        end_bracket = content.find("]]", idx)
        return content[max(0, idx - ctx):end_bracket + 2]
    start = max(0, idx - ctx)
    end = min(len(content), idx + len(pattern_a) + ctx)
    snippet = content[start:end]
    return ("..." if start > 0 else "") + snippet + ("..." if end < len(content) else "")


@router.get("/api/notes", response_model=NoteListResponse)
def list_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str = "",
    limit: int = 100,
):
    q = db.query(Note).filter(Note.user_id == current_user.id)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Note.title.like(like), Note.content.like(like)))
    notes = q.order_by(desc(Note.updated_at)).limit(limit).all()
    return {
        "items": [
            NoteListItem(
                id=n.id, title=n.title, is_daily=n.is_daily,
                is_auto_created=n.is_auto_created, tags=n.tags, updated_at=n.updated_at
            ) for n in notes
        ],
        "total": len(notes),
    }


@router.post("/api/notes", response_model=NoteResponse)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    title = payload.title.strip()
    if not title:
        raise HTTPException(400, "标题不能为空")

    existing = db.query(Note).filter(Note.user_id == current_user.id, Note.title == title).first()
    if existing:
        raise HTTPException(409, "同名笔记已存在")

    note = Note(
        user_id=current_user.id,
        title=title,
        content=payload.content,
        tags=extract_tags(payload.content),
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    # 检查笔记作家成就
    notes_count = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.is_auto_created == False,
    ).count()
    achievement_service.check_achievements(db, current_user.id, {
        "notes_count": notes_count,
    })

    return note


@router.post("/api/notes/ensure", response_model=NoteResponse)
def ensure_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """确保指定标题的笔记存在（用于 [[X]] 跳转）"""
    title = payload.title.strip()
    if not title:
        raise HTTPException(400, "标题不能为空")
    note = db.query(Note).filter(Note.user_id == current_user.id, Note.title == title).first()
    if not note:
        note = Note(
            user_id=current_user.id, title=title, content=payload.content,
            is_auto_created=True, tags=extract_tags(payload.content),
        )
        db.add(note)
        db.commit()
        db.refresh(note)
    return note


@router.get("/api/notes/by-title/{title}", response_model=NoteResponse)
def get_note_by_title(
    title: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.user_id == current_user.id, Note.title == title).first()
    if not note:
        raise HTTPException(404, "笔记不存在")
    return note


@router.get("/api/notes/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(404, "笔记不存在")
    return note


@router.put("/api/notes/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(404, "笔记不存在")
    if payload.title is not None and payload.title.strip() != note.title:
        new_title = payload.title.strip()
        existing = db.query(Note).filter(
            Note.user_id == current_user.id, Note.title == new_title, Note.id != note_id
        ).first()
        if existing:
            raise HTTPException(409, "同名笔记已存在")
        note.title = new_title
    if payload.content is not None:
        note.content = payload.content
        note.tags = extract_tags(payload.content)
    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/api/notes/{note_id}", response_model=dict)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(404, "笔记不存在")
    db.delete(note)
    db.commit()
    return {"message": "删除成功"}


@router.get("/api/notes/{note_id}/backlinks", response_model=list[BacklinkItem])
def get_backlinks(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(404, "笔记不存在")
    target = note.title
    pattern_a = f"%[[{target}]]%"
    pattern_b = f"%[[{target}|%"
    rows = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.id != note_id,
        or_(Note.content.like(pattern_a), Note.content.like(pattern_b)),
    ).all()
    out = []
    for r in rows:
        snippet = extract_snippet(r.content or "", target)
        out.append(BacklinkItem(
            source_id=r.id, source_title=r.title, snippet=snippet, updated_at=r.updated_at
        ))
    return out


@router.post("/api/notes/daily", response_model=NoteResponse)
def open_daily_note(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """打开或创建今日 Daily Note"""
    today = date.today().isoformat()
    note = db.query(Note).filter(
        Note.user_id == current_user.id, Note.title == today, Note.is_daily == True
    ).first()
    if not note:
        body = f"# {today}\n\n## 今日学习目标\n- \n\n## 复习记录\n\n## 心得总结\n"
        note = Note(
            user_id=current_user.id, title=today, content=body,
            is_daily=True, tags="daily",
        )
        db.add(note)
        db.commit()
        db.refresh(note)
    return note


@router.get("/api/notes/graph/all", response_model=NotesGraphResponse)
def get_notes_graph(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取所有笔记 + 双链关系图"""
    notes = db.query(Note).filter(Note.user_id == current_user.id).all()
    if not notes:
        return {"nodes": [], "links": []}

    title_to_id = {n.title: n.id for n in notes}
    # 提取所有 [[target]] 并建立链接
    links_map: dict[tuple[int, int], int] = {}  # (src, dst) -> count
    for n in notes:
        for target in extract_links(n.content or ""):
            target_id = title_to_id.get(target.strip())
            if target_id and target_id != n.id:
                key = (n.id, target_id)
                links_map[key] = links_map.get(key, 0) + 1

    # 节点大小 = 1 + log(连接数)
    val_count: dict[int, int] = {n.id: 0 for n in notes}
    for (s, t), c in links_map.items():
        val_count[s] = val_count.get(s, 0) + c
        val_count[t] = val_count.get(t, 0) + c

    return {
        "nodes": [
            NoteGraphNode(
                id=n.id, title=n.title, is_auto_created=n.is_auto_created,
                val=1 + (val_count.get(n.id, 0) if val_count.get(n.id, 0) > 0 else 0)
            ) for n in notes
        ],
        "links": [
            NoteGraphLink(source=s, target=t) for (s, t) in links_map.keys()
        ],
    }