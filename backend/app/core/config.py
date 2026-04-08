from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DocFlow"
    DEBUG: bool = False

    # Database - allow Railway's default DATABASE_URL (postgres://)
    DATABASE_URL: Optional[str] = None
    DATABASE_URL_SYNC: Optional[str] = None

    # Redis
    REDIS_URL: Optional[str] = None
    REDIS_PUBSUB_CHANNEL_PREFIX: str = "job_progress:"

    # Celery
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # Storage
    UPLOAD_DIR: str = "/tmp/docflow/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    def model_post_init(self, __context):
        # Convert Railway's postgres:// to postgresql+asyncpg:// if needed
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgres://"):
                self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
            elif self.DATABASE_URL.startswith("postgresql://"):
                self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Fallback for DATABASE_URL_SYNC
        if not self.DATABASE_URL_SYNC and self.DATABASE_URL:
            self.DATABASE_URL_SYNC = self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()