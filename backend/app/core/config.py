from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DocFlow"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:ZqvSPGSHLUZkzeweRLMWsPoxnxfcWRTl@postgres.railway.internal:5432/railway"
    DATABASE_URL_SYNC: str = "postgresql://postgres:ZqvSPGSHLUZkzeweRLMWsPoxnxfcWRTl@postgres.railway.internal:5432/railway"
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_PUBSUB_CHANNEL_PREFIX: str = "job_progress:"

    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # Storage
    UPLOAD_DIR: str = "/tmp/docflow/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://frontend:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DocFlow"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://docflow:docflow@postgres:5432/docflow"
    DATABASE_URL_SYNC: str = "postgresql://docflow:docflow@postgres:5432/docflow"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_PUBSUB_CHANNEL_PREFIX: str = "job_progress:"

    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # Storage
    UPLOAD_DIR: str = "/tmp/docflow/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://frontend:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()