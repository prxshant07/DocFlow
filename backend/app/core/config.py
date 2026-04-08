from pydantic_settings import BaseSettings
from typing import List, Optional
import os
import json


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

    # CORS - handle both JSON string and plain string
    CORS_ORIGINS_RAW: Optional[str] = None

    @property
    def CORS_ORIGINS(self) -> List[str]:
        if not self.CORS_ORIGINS_RAW:
            return ["*"]
        try:
            # Try to parse as JSON list
            parsed = json.loads(self.CORS_ORIGINS_RAW)
            return parsed if isinstance(parsed, list) else [self.CORS_ORIGINS_RAW]
        except (json.JSONDecodeError, TypeError):
            # Fall back to single origin or wildcard
            return [self.CORS_ORIGINS_RAW]

    def model_post_init(self, __context):
        # Convert Railway's postgres:// to postgresql+asyncpg:// if needed
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            if self.DATABASE_URL.startswith("postgres://"):
                self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
            elif self.DATABASE_URL.startswith("postgresql://"):
                self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Fallback for DATABASE_URL_SYNC
        if (not self.DATABASE_URL_SYNC or not self.DATABASE_URL_SYNC.strip()) and self.DATABASE_URL:
            self.DATABASE_URL_SYNC = self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)

        # Ensure REDIS_URL has database number
        if self.REDIS_URL and self.REDIS_URL.strip():
            if not self.REDIS_URL.rstrip('/').endswith('/0') and '/0' not in self.REDIS_URL:
                self.REDIS_URL = self.REDIS_URL.rstrip('/') + '/0'

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()