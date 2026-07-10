from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgePoint, KnowledgeRelation
from app.models.flashcard import Flashcard
from app.models.review import ReviewSchedule
from datetime import date


def get_mastery_color(level: float) -> str:
    """Get color based on mastery level."""
    if level >= 0.8:
        return "#10B981"  # green
    elif level >= 0.6:
        return "#34D399"
    elif level >= 0.4:
        return "#F59E0B"  # yellow
    elif level >= 0.2:
        return "#F97316"  # orange
    return "#EF4444"  # red


def build_graph_from_extraction(db: Session, material_id: int, user_id: int, extraction_result: dict):
    """Create knowledge points and relations from AI extraction result."""
    title_to_id = {}

    # Create knowledge points
    for kp_data in extraction_result.get("knowledge_points", []):
        kp = KnowledgePoint(
            material_id=material_id,
            user_id=user_id,
            title=kp_data["title"],
            content=kp_data["content"],
            importance=kp_data.get("importance", 3),
            mastery_level=0.0
        )
        db.add(kp)
        db.flush()
        title_to_id[kp_data["title"]] = kp.id

    # Create relations
    for rel_data in extraction_result.get("relations", []):
        source_title = rel_data.get("source_title", "")
        target_title = rel_data.get("target_title", "")
        source_id = title_to_id.get(source_title)
        target_id = title_to_id.get(target_title)

        if source_id and target_id:
            relation = KnowledgeRelation(
                source_id=source_id,
                target_id=target_id,
                relation_type=rel_data.get("relation_type", "related"),
                description=rel_data.get("description")
            )
            db.add(relation)

    db.commit()
    return len(title_to_id)


def get_graph_data(db: Session, user_id: int) -> dict:
    """Get knowledge graph data for visualization."""
    points = db.query(KnowledgePoint).filter(
        KnowledgePoint.user_id == user_id
    ).all()

    relations = db.query(KnowledgeRelation).filter(
        KnowledgeRelation.source_id.in_([p.id for p in points])
    ).all()

    nodes = [
        {
            "id": p.id,
            "name": p.title,
            "val": p.importance,
            "color": get_mastery_color(p.mastery_level),
            "mastery_level": p.mastery_level,
            "content": p.content
        }
        for p in points
    ]

    links = [
        {
            "source": r.source_id,
            "target": r.target_id,
            "label": r.relation_type,
            "description": r.description
        }
        for r in relations
    ]

    return {"nodes": nodes, "links": links}
