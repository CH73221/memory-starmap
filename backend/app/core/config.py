import os
from pydantic_settings import BaseSettings
from functools import lru_cache


def _default_db_url():
    """Use /tmp on Render (read-only filesystem), local dir otherwise."""
    if os.environ.get("RENDER"):
        return "sqlite:////tmp/memory_starmap.db"
    return "sqlite:///./data/memory_starmap.db"


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    AI_MODEL: str = "gpt-4o"
    DATABASE_URL: str = _default_db_url()
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = "/tmp/uploads" if os.environ.get("RENDER") else "./uploads"
    MAX_FILE_SIZE_MB: int = 20
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
