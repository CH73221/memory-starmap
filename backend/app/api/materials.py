import os
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db, get_db_session
from app.core.config import settings
from app.api.auth import get_current_user
from app.models.user import User
from app.models.material import Material
from app.models.knowledge import KnowledgePoint
from app.schemas.material import MaterialResponse, MaterialListResponse
from app.services.pdf_service import extract_text_from_pdf
from app.services.ocr_service import extract_text_from_image
from app.services.ai_service import extract_knowledge
from app.services.graph_service import build_graph_from_extraction
from app.services import achievement_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/materials", tags=["materials"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".txt", ".md"}


async def process_material(material_id: int, file_path: str, file_type: str):
    """Background task to process uploaded material. Uses independent DB session."""
    try:
        with get_db_session() as db:
            material = db.query(Material).filter(Material.id == material_id).first()
            if not material:
                return

            material.status = "processing"
            db.commit()

            if file_type == "pdf":
                raw_text = extract_text_from_pdf(file_path)
            elif file_type == "image":
                raw_text = extract_text_from_image(file_path)
            else:
                raw_text = material.raw_text or ""

            material.raw_text = raw_text

            if not raw_text or len(raw_text.strip()) < 10:
                material.status = "failed"
                material.summary = "无法提取文本内容"
                db.commit()
                return

            extraction_result = await extract_knowledge(raw_text)
            material.summary = extraction_result.get("summary", "")

            point_count = build_graph_from_extraction(
                db=db, material_id=material_id, user_id=material.user_id, extraction_result=extraction_result
            )

            material.status = "completed"
            db.commit()
            logger.info(f"Material {material_id} processed: {point_count} knowledge points")

    except Exception as e:
        logger.error(f"Material processing error for material_id={material_id}: {e}", exc_info=True)
        with get_db_session() as db:
            material = db.query(Material).filter(Material.id == material_id).first()
            if material:
                material.status = "failed"
                material.summary = f"处理失败: {str(e)}"
                db.commit()


@router.post("/upload", response_model=MaterialResponse)
async def upload_material(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a learning material (PDF, image, or text)."""
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型: {file_ext}。支持: {', '.join(sorted(ALLOWED_EXTENSIONS))}")

    if file_ext == ".pdf":
        file_type = "pdf"
    elif file_ext in ('.png', '.jpg', '.jpeg', '.gif', '.webp'):
        file_type = "image"
    else:
        file_type = "text"

    content = await file.read()
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail=f"文件大小超过限制: 最大 {settings.MAX_FILE_SIZE_MB}MB")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, saved_filename)
    with open(file_path, "wb") as f:
        f.write(content)

    raw_text = None
    if file_type == "text":
        raw_text = content.decode("utf-8", errors="ignore")

    material = Material(
        user_id=current_user.id, title=title, file_path=file_path,
        file_type=file_type, raw_text=raw_text, status="pending"
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    materials_count = db.query(Material).filter(Material.user_id == current_user.id).count()
    achievement_service.check_achievements(db, current_user.id, {"materials_count": materials_count})

    background_tasks.add_task(process_material, material.id, file_path, file_type)

    return MaterialResponse(
        id=material.id, user_id=material.user_id, title=material.title,
        file_type=material.file_type, status=material.status, summary=material.summary,
        knowledge_point_count=0, created_at=material.created_at, updated_at=material.updated_at
    )


@router.get("/", response_model=MaterialListResponse)
def list_materials(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    materials = db.query(Material).filter(Material.user_id == current_user.id).order_by(Material.created_at.desc()).all()
    # Batch count knowledge points to avoid N+1 queries
    material_ids = [m.id for m in materials]
    if material_ids:
        from sqlalchemy import func
        kp_counts = dict(
            db.query(KnowledgePoint.material_id, func.count(KnowledgePoint.id))
            .filter(KnowledgePoint.material_id.in_(material_ids))
            .group_by(KnowledgePoint.material_id)
            .all()
        )
    else:
        kp_counts = {}
    result = []
    for m in materials:
        kp_count = kp_counts.get(m.id, 0)
        result.append(MaterialResponse(
            id=m.id, user_id=m.user_id, title=m.title, file_type=m.file_type,
            status=m.status, summary=m.summary, knowledge_point_count=kp_count,
            created_at=m.created_at, updated_at=m.updated_at
        ))
    return MaterialListResponse(items=result, total=len(result))


@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(material_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material = db.query(Material).filter(Material.id == material_id, Material.user_id == current_user.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="资料不存在")
    kp_count = len(material.knowledge_points) if material.knowledge_points else 0
    return MaterialResponse(
        id=material.id, user_id=material.user_id, title=material.title, file_type=material.file_type,
        status=material.status, summary=material.summary, knowledge_point_count=kp_count,
        created_at=material.created_at, updated_at=material.updated_at
    )


@router.put("/{material_id}")
def update_material(material_id: int, title: str = Form(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update material title."""
    material = db.query(Material).filter(Material.id == material_id, Material.user_id == current_user.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="资料不存在")
    material.title = title
    db.commit()
    return {"message": "更新成功", "id": material.id, "title": material.title}


@router.post("/{material_id}/reprocess")
def reprocess_material(material_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retry processing a failed or completed material."""
    material = db.query(Material).filter(Material.id == material_id, Material.user_id == current_user.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="资料不存在")
    if not material.file_path or not os.path.exists(material.file_path):
        raise HTTPException(status_code=400, detail="文件不存在，无法重新处理")
    material.status = "pending"
    db.commit()
    background_tasks.add_task(process_material, material.id, material.file_path, material.file_type)
    return {"message": "重新处理已开始", "material_id": material.id}


@router.delete("/{material_id}", response_model=dict)
def delete_material(material_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material = db.query(Material).filter(Material.id == material_id, Material.user_id == current_user.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="资料不存在")
    if material.file_path and os.path.exists(material.file_path):
        os.remove(material.file_path)
    db.delete(material)
    db.commit()
    return {"message": "删除成功"}
