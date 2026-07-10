import inspect
import logging
from sqlalchemy import create_engine, text, inspect as sa_inspect
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapper
from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from contextlib import contextmanager


@contextmanager
def get_db_session():
    """Context manager for creating independent DB sessions (for BackgroundTasks)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_model_column_spec(column):
    """从 SQLAlchemy Column 生成 SQLite 列定义字符串。"""
    col_type = column.type.compile(dialect=engine.dialect)
    spec = f'"{column.name}" {col_type}'
    if not column.nullable:
        spec += " NOT NULL"
    if column.default is not None and hasattr(column.default, 'arg'):
        default_val = column.default.arg
        if isinstance(default_val, str):
            spec += f" DEFAULT '{default_val}'"
        elif isinstance(default_val, (int, float)):
            spec += f" DEFAULT {default_val}"
        elif isinstance(default_val, bool):
            spec += f" DEFAULT {1 if default_val else 0}"
    return spec


def migrate_schema():
    """
    自动迁移数据库 schema。
    - 创建不存在的表
    - 为已存在的表添加缺失的列（SQLite 安全方式）
    """
    inspector = sa_inspect(engine)
    existing_tables = set(inspector.get_table_names())

    # 收集所有模型
    models = {}
    for mapper in Base.registry.mappers:
        if isinstance(mapper, Mapper):
            table = mapper.local_table
            if table is not None:
                models[table.name] = mapper.class_

    # 第一步：创建所有缺失的表
    Base.metadata.create_all(bind=engine)

    # 第二步：为已存在的表添加缺失的列
    with engine.begin() as conn:
        for table_name, model_cls in models.items():
            if table_name not in existing_tables:
                continue  # 新表，create_all 已经处理了

            existing_cols = {col["name"] for col in inspector.get_columns(table_name)}

            # 找出模型中有但数据库中没有的列
            mapper = sa_inspect(model_cls)
            missing_columns = []
            for col_name, col_attr in mapper.columns.items():
                if col_name not in existing_cols and col_attr.name not in existing_cols:
                    # 跳过主键列和有 autoincrement 的列
                    if col_attr.primary_key:
                        continue
                    missing_columns.append(col_attr)

            for col in missing_columns:
                col_spec = _get_model_column_spec(col)
                try:
                    conn.execute(text(f'ALTER TABLE "{table_name}" ADD COLUMN {col_spec}'))
                    logger.info("Added column '%s' to table '%s'", col.name, table_name)
                except Exception as e:
                    logger.error("Failed to add column '%s' to '%s': %s", col.name, table_name, e)


def create_tables():
    Base.metadata.create_all(bind=engine)
    migrate_schema()
