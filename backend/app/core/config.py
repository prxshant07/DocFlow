from pydantic_settings import BaseSettings
from typing import List


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
    REDIS_URL: str = "redis://default:QseFlDulZbPlmzmemBPwxpJeMBMKYAqj@redis.railway.internal:6379"
    REDIS_PUBSUB_CHANNEL_PREFIX: str = "job_progress:"

    # Celery
    CELERY_BROKER_URL: str = "redis://default:QseFlDulZbPlmzmemBPwxpJeMBMKYAqj@redis.railway.internal:6379"
    CELERY_RESULT_BACKEND: str = "redis://default:QseFlDulZbPlmzmemBPwxpJeMBMKYAqj@redis.railway.internal:6379"

    # Storage
    UPLOAD_DIR: str = "/tmp/docflow/uploads"
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    CORS_ORIGINS: List[str] = ["https://incredible-achievement-production.up.railway.app"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()