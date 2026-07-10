import os
import logging
import secrets
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from app.core.config import settings
from app.core.database import create_tables

# Import API routers
from app.api.auth import router as auth_router
from app.api.materials import router as materials_router
from app.api.knowledge import router as knowledge_router
from app.api.flashcards import router as flashcards_router
from app.api.stats import router as stats_router
from app.api.study_plans import router as study_plans_router
from app.api.extra import router as extra_router
from app.api.notes import router as notes_router
from app.api.ai import router as ai_router

# Import all models to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.material import Material
from app.models.knowledge import KnowledgePoint, KnowledgeRelation
from app.models.flashcard import Flashcard
from app.models.review import ReviewSchedule, ReviewHistory
from app.models.study_plan import StudyPlan, StudyPlanProgress
from app.models.extra import Mistake, FocusSession, MistakeKnowledgeRelation
from app.models.note import Note
from app.models.achievement import Achievement

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# SECRET_KEY security check
if settings.SECRET_KEY == "change-me-in-production":
    settings.SECRET_KEY = secrets.token_urlsafe(32)
    logger.warning("SECRET_KEY is default! Generated random key for this session. Set SECRET_KEY in .env for production.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    create_tables()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs("data", exist_ok=True)
    yield


app = FastAPI(title="记忆星图 API", description="AI 智能复习引擎后端 API", version="1.0.0", lifespan=lifespan)

# CORS middleware - support environment variable for origins
cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=getattr(exc, "headers", None))


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "请求参数校验失败", "errors": jsonable_encoder(exc.errors())})


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "服务器内部错误"})


# Include routers
app.include_router(auth_router)
app.include_router(materials_router)
app.include_router(knowledge_router)
app.include_router(flashcards_router)
app.include_router(stats_router)
app.include_router(study_plans_router)
app.include_router(extra_router)
app.include_router(notes_router)
app.include_router(ai_router)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "记忆星图 API 运行正常"}
