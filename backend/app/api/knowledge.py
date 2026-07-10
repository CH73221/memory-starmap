from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.knowledge import KnowledgePoint, KnowledgeRelation
from app.models.flashcard import Flashcard
from app.schemas.knowledge import (
    KnowledgePointResponse,
    GraphResponse,
    KnowledgePointUpdate,
    KnowledgeRelationResponse,
    KnowledgeRelationDetail,
    KnowledgePointDetail,
    NeighborNode,
    CreateRelationRequest,
)
from app.schemas.flashcard import FlashcardResponse
from app.services.graph_service import get_graph_data

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("/graph", response_model=GraphResponse)
def get_graph(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete knowledge graph for visualization."""
    data = get_graph_data(db, current_user.id)
    return GraphResponse(nodes=data["nodes"], links=data["links"])


@router.get("/points", response_model=list[KnowledgePointResponse])
def list_points(
    material_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all knowledge points, optionally filtered by material."""
    query = db.query(KnowledgePoint).filter(KnowledgePoint.user_id == current_user.id)
    if material_id:
        query = query.filter(KnowledgePoint.material_id == material_id)
    
    points = query.order_by(KnowledgePoint.importance.desc()).all()
    return [KnowledgePointResponse.model_validate(p) for p in points]


@router.get("/points/{point_id}", response_model=KnowledgePointResponse)
def get_point(
    point_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get knowledge point detail."""
    point = db.query(KnowledgePoint).filter(
        KnowledgePoint.id == point_id,
        KnowledgePoint.user_id == current_user.id
    ).first()
    if not point:
        raise HTTPException(status_code=404, detail="知识点不存在")
    return KnowledgePointResponse.model_validate(point)


@router.put("/points/{point_id}", response_model=KnowledgePointResponse)
def update_point(
    point_id: int,
    # 改进 7：将 data 类型从 dict 改为 KnowledgePointUpdate schema，
    # 利用 Pydantic 进行类型校验，替代原先无类型的 dict
    data: KnowledgePointUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update knowledge point."""
    point = db.query(KnowledgePoint).filter(
        KnowledgePoint.id == point_id,
        KnowledgePoint.user_id == current_user.id
    ).first()
    if not point:
        raise HTTPException(status_code=404, detail="知识点不存在")

    # 改进 7：使用 model_dump(exclude_unset=True) 只获取请求中实际传入的字段，
    # 遍历更新，替代原先手动检查 dict key 的重复代码
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(point, field, value)

    db.commit()
    db.refresh(point)
    return KnowledgePointResponse.model_validate(point)


@router.delete("/points/{point_id}", response_model=dict)
def delete_point(
    point_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete knowledge point."""
    point = db.query(KnowledgePoint).filter(
        KnowledgePoint.id == point_id,
        KnowledgePoint.user_id == current_user.id
    ).first()
    if not point:
        raise HTTPException(status_code=404, detail="知识点不存在")

    db.delete(point)
    db.commit()
    return {"message": "删除成功"}


@router.get("/points/{point_id}/relations", response_model=list[KnowledgeRelationDetail])
def get_point_relations(
    point_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取某个知识点的所有关系（含关系类型、邻居节点详情）。"""
    point = db.query(KnowledgePoint).filter(
        KnowledgePoint.id == point_id,
        KnowledgePoint.user_id == current_user.id
    ).first()
    if not point:
        raise HTTPException(status_code=404, detail="知识点不存在")

    # 查询所有出向和入向关系
    relations = db.query(KnowledgeRelation).filter(
        or_(
            KnowledgeRelation.source_id == point_id,
            KnowledgeRelation.target_id == point_id
        )
    ).all()

    result = []
    # Batch load source/target points to avoid N+1 queries
    all_point_ids = set()
    for rel in relations:
        all_point_ids.add(rel.source_id)
        all_point_ids.add(rel.target_id)
    points_map = {}
    if all_point_ids:
        points = db.query(KnowledgePoint).filter(
            KnowledgePoint.id.in_(list(all_point_ids)),
            KnowledgePoint.user_id == current_user.id
        ).all()
        points_map = {p.id: p for p in points}

    for rel in relations:
        source_point = points_map.get(rel.source_id)
        target_point = points_map.get(rel.target_id)
        result.append(KnowledgeRelationDetail(
            id=rel.id,
            source_id=rel.source_id,
            target_id=rel.target_id,
            relation_type=rel.relation_type,
            description=rel.description,
            source=KnowledgePointResponse.model_validate(source_point) if source_point else None,
            target=KnowledgePointResponse.model_validate(target_point) if target_point else None,
        ))
    return result


@router.get("/points/{point_id}/flashcards", response_model=list[FlashcardResponse])
def get_point_flashcards(
    point_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取某个知识点下的所有闪卡。"""
    point = db.query(KnowledgePoint).filter(
        KnowledgePoint.id == point_id,
        KnowledgePoint.user_id == current_user.id
    ).first()
    if not point:
        raise HTTPException(status_code=404, detail="知识点不存在")

    flashcards = db.query(Flashcard).filter(
        Flashcard.knowledge_point_id == point_id,
        Flashcard.user_id == current_user.id,
        Flashcard.is_active == True
    ).order_by(Flashcard.created_at.desc()).all()

    result = []
    for f in flashcards:
        result.append(FlashcardResponse(
            id=f.id,
            question=f.question,
            answer=f.answer,
            card_type=f.card_type,
            difficulty=f.difficulty,
            knowledge_point_title=point.title,
        ))
    return result


@router.get("/points/{point_id}/neighbors", response_model=list[NeighborNode])
def get_point_neighbors(
    point_id: int,
    depth: int = 2,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取 N 跳邻居节点。"""
    point = db.query(KnowledgePoint).filter(
        KnowledgePoint.id == point_id,
        KnowledgePoint.user_id == current_user.id
    ).first()
    if not point:
        raise HTTPException(status_code=404, detail="知识点不存在")

    if depth < 1:
        depth = 1
    if depth > 5:
        depth = 5  # 限制最大深度，防止性能问题

    # BFS 查找邻居
    visited = {point_id: 0}  # id -> depth
    queue = [point_id]
    relation_types = {}  # id -> relation_type (到达该节点的关系类型)

    current_depth = 0
    while queue and current_depth < depth:
        current_depth += 1
        level_size = len(queue)
        for _ in range(level_size):
            current_id = queue.pop(0)
            # 查询当前节点的所有关系
            relations = db.query(KnowledgeRelation).filter(
                or_(
                    KnowledgeRelation.source_id == current_id,
                    KnowledgeRelation.target_id == current_id
                )
            ).all()
            for rel in relations:
                # 确定邻居节点 ID
                if rel.source_id == current_id:
                    neighbor_id = rel.target_id
                else:
                    neighbor_id = rel.source_id

                # 验证邻居属于当前用户
                neighbor_point = db.query(KnowledgePoint).filter(
                    KnowledgePoint.id == neighbor_id,
                    KnowledgePoint.user_id == current_user.id
                ).first()
                if not neighbor_point:
                    continue

                if neighbor_id not in visited:
                    visited[neighbor_id] = current_depth
                    relation_types[neighbor_id] = rel.relation_type
                    queue.append(neighbor_id)

    # 构建结果（排除自身）
    result = []
    for nid, d in visited.items():
        if nid == point_id:
            continue
        np = db.query(KnowledgePoint).filter(KnowledgePoint.id == nid).first()
        if np:
            result.append(NeighborNode(
                id=np.id,
                title=np.title,
                mastery_level=np.mastery_level,
                relation_type=relation_types.get(nid, "related"),
                depth=d,
            ))

    # 按距离排序
    result.sort(key=lambda x: x.depth)
    return result


@router.post("/relations", response_model=KnowledgeRelationResponse)
def create_relation(
    data: CreateRelationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建知识点之间的关系。"""
    # 验证两个知识点都存在且属于当前用户
    source = db.query(KnowledgePoint).filter(
        KnowledgePoint.id == data.source_id,
        KnowledgePoint.user_id == current_user.id
    ).first()
    if not source:
        raise HTTPException(status_code=404, detail="源知识点不存在")

    target = db.query(KnowledgePoint).filter(
        KnowledgePoint.id == data.target_id,
        KnowledgePoint.user_id == current_user.id
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="目标知识点不存在")

    if data.source_id == data.target_id:
        raise HTTPException(status_code=400, detail="不能创建自关联关系")

    # 检查是否已存在相同关系
    existing = db.query(KnowledgeRelation).filter(
        or_(
            and_(
                KnowledgeRelation.source_id == data.source_id,
                KnowledgeRelation.target_id == data.target_id,
            ),
            and_(
                KnowledgeRelation.source_id == data.target_id,
                KnowledgeRelation.target_id == data.source_id,
            ),
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="关系已存在")

    # 验证关系类型
    valid_types = {"prerequisite", "related", "part_of", "similar"}
    if data.relation_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"无效的关系类型，可选值: {valid_types}")

    relation = KnowledgeRelation(
        source_id=data.source_id,
        target_id=data.target_id,
        relation_type=data.relation_type,
        description=data.description,
    )
    db.add(relation)
    db.commit()
    db.refresh(relation)
    return KnowledgeRelationResponse.model_validate(relation)


@router.delete("/relations/{relation_id}", response_model=dict)
def delete_relation(
    relation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除关系。"""
    relation = db.query(KnowledgeRelation).filter(
        KnowledgeRelation.id == relation_id
    ).first()
    if not relation:
        raise HTTPException(status_code=404, detail="关系不存在")

    # 验证关系属于当前用户（通过源知识点判断）
    source = db.query(KnowledgePoint).filter(
        KnowledgePoint.id == relation.source_id,
        KnowledgePoint.user_id == current_user.id
    ).first()
    if not source:
        raise HTTPException(status_code=403, detail="无权删除此关系")

    db.delete(relation)
    db.commit()
    return {"message": "删除成功"}
