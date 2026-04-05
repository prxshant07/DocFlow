from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "docflow",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    
    # Timezone
    timezone="UTC",
    enable_utc=True,
    
    # Task behavior
    task_track_started=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,  # One task per worker at a time for fairness
    
    # Retry policy defaults
    task_max_retries=3,
    task_default_retry_delay=5,  # seconds
    
    # Result expiry
    result_expires=86400,  # 24 hours
    
    # Queues
    task_default_queue="default",
    task_routes={
        "app.workers.tasks.process_document_task": {"queue": "documents"},
    },
)
