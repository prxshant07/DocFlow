"""
Celery worker tasks for document processing.

Each stage publishes progress events via Redis Pub/Sub.
The FastAPI backend subscribes and streams updates to the frontend via SSE.
"""

import time
import json
import uuid
import random
from datetime import datetime, timezone

import redis
from celery import Task
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.workers.celery_app import celery_app
from app.core.config import settings

# ─── Synchronous DB + Redis (Celery workers are sync) ─────────────────────────

sync_engine = create_engine("postgresql://postgres:ZqvSPGSHLUZkzeweRLMWsPoxnxfcWRTl@postgres.railway.internal:5432/railway", pool_pre_ping=True)
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def _publish(job_id: str, document_id: str, status: str, stage: str | None, message: str, progress_pct: int, error: str | None = None):
    """Publish a progress event to the Redis Pub/Sub channel for this job."""
    event = {
        "job_id": job_id,
        "document_id": document_id,
        "status": status,
        "stage": stage,
        "message": message,
        "progress_pct": progress_pct,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "error": error,
    }
    channel = f"{settings.REDIS_PUBSUB_CHANNEL_PREFIX}{job_id}"
    redis_client.publish(channel, json.dumps(event))
    return event


def _update_job_in_db(session: Session, job_id: str, **kwargs):
    """Update job record directly (sync) from within a Celery worker."""
    # Import here to avoid Celery circular-import issues
    from app.models.models import Job
    job = session.get(Job, job_id)
    if job:
        for k, v in kwargs.items():
            setattr(job, k, v)
        session.commit()
    return job


# ─── Simulated Processing Logic ────────────────────────────────────────────────

CATEGORIES = ["Technical Report", "Research Paper", "Business Document", "Legal Contract", "Invoice", "Manual"]

def _simulate_parse(filename: str) -> dict:
    """Mock parsing: extract raw text simulation."""
    time.sleep(random.uniform(1.5, 3.0))  # Simulate IO-bound work
    return {
        "page_count": random.randint(1, 50),
        "word_count": random.randint(200, 10000),
        "language": "English",
        "encoding": "UTF-8",
    }


def _simulate_extract(parse_result: dict, filename: str) -> dict:
    """Mock AI extraction: generate structured data from parsed text."""
    time.sleep(random.uniform(2.0, 4.0))  # Simulate ML inference
    stem = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()
    keywords = random.sample(
        ["analysis", "report", "data", "process", "system", "workflow",
         "management", "strategy", "overview", "framework", "architecture"],
        k=random.randint(3, 6)
    )
    return {
        "title": f"{stem} — Processed Report",
        "category": random.choice(CATEGORIES),
        "summary": (
            f"This document ({stem}) contains {parse_result['word_count']:,} words across "
            f"{parse_result['page_count']} pages. It appears to be a {random.choice(CATEGORIES).lower()} "
            f"covering topics including {', '.join(keywords[:3])}. "
            f"The content has been automatically extracted and structured for review."
        ),
        "keywords": keywords,
        "metadata": parse_result,
    }


# ─── Main Celery Task ──────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.workers.tasks.process_document_task",
    max_retries=3,
    default_retry_delay=10,
    soft_time_limit=300,
    time_limit=360,
)
def process_document_task(self: Task, document_id: str, job_id: str) -> dict:
    """
    Main document processing pipeline.

    Stages:
      1. document_received  (0%)
      2. parsing_started    (15%)
      3. parsing_completed  (45%)
      4. extraction_started (50%)
      5. extraction_completed (80%)
      6. final_result_stored  (95%)
      7. job_completed        (100%)
    """
    from app.models.models import Job, Document, ExtractedData, JobStatus, JobStage

    with Session(sync_engine) as session:
        # ── Stage 0: Initialise ────────────────────────────────────────────
        job = session.get(Job, job_id)
        document = session.get(Document, document_id)

        if not job or not document:
            return {"error": "Job or document not found"}

        try:
            # ── Stage 1: document_received ─────────────────────────────────
            job.status = JobStatus.processing
            job.current_stage = JobStage.document_received
            job.started_at = datetime.utcnow()
            session.commit()

            _publish(job_id, document_id, "processing", "document_received",
                     "Document received and queued for processing", 5)
            time.sleep(0.5)

            # ── Stage 2: parsing_started ───────────────────────────────────
            job.current_stage = JobStage.parsing_started
            session.commit()

            _publish(job_id, document_id, "processing", "parsing_started",
                     "Parsing document content…", 15)

            parse_result = _simulate_parse(document.original_filename)

            # ── Stage 3: parsing_completed ─────────────────────────────────
            job.current_stage = JobStage.parsing_completed
            session.commit()

            _publish(job_id, document_id, "processing", "parsing_completed",
                     f"Parsed {parse_result['page_count']} pages, {parse_result['word_count']:,} words", 45)
            time.sleep(0.3)

            # ── Stage 4: extraction_started ────────────────────────────────
            job.current_stage = JobStage.extraction_started
            session.commit()

            _publish(job_id, document_id, "processing", "extraction_started",
                     "Running AI extraction pipeline…", 50)

            extract_result = _simulate_extract(parse_result, document.original_filename)

            # ── Stage 5: extraction_completed ──────────────────────────────
            job.current_stage = JobStage.extraction_completed
            session.commit()

            _publish(job_id, document_id, "processing", "extraction_completed",
                     f"Extracted: '{extract_result['title']}'", 80)
            time.sleep(0.3)

            # ── Stage 6: final_result_stored ───────────────────────────────
            # Upsert ExtractedData record
            existing = session.execute(
                select(ExtractedData).where(ExtractedData.document_id == document_id)
            ).scalar_one_or_none()

            if existing:
                for k, v in extract_result.items():
                    if hasattr(existing, k):
                        setattr(existing, k, v)
                existing.raw_json = extract_result
                existing.updated_at = datetime.utcnow()
            else:
                extracted = ExtractedData(
                    id=str(uuid.uuid4()),
                    document_id=document_id,
                    title=extract_result["title"],
                    category=extract_result["category"],
                    summary=extract_result["summary"],
                    keywords=extract_result["keywords"],
                    raw_json=extract_result,
                )
                session.add(extracted)

            job.current_stage = JobStage.final_result_stored
            session.commit()

            _publish(job_id, document_id, "processing", "final_result_stored",
                     "Structured data saved to database", 95)
            time.sleep(0.2)

            # ── Stage 7: job_completed ─────────────────────────────────────
            job.status = JobStatus.completed
            job.current_stage = JobStage.job_completed
            job.completed_at = datetime.utcnow()
            session.commit()

            _publish(job_id, document_id, "job_completed", "job_completed",
                     "Processing complete ✓", 100)

            return {
                "document_id": document_id,
                "job_id": job_id,
                "status": "completed",
                "title": extract_result["title"],
            }

        except Exception as exc:
            # Failure path: update DB and publish failure event
            try:
                job.status = JobStatus.failed
                job.current_stage = JobStage.job_failed
                job.error_message = str(exc)
                job.completed_at = datetime.utcnow()
                session.commit()
            except Exception:
                session.rollback()

            _publish(job_id, document_id, "job_failed", "job_failed",
                     "Processing failed", 0, error=str(exc))

            # Retry with exponential back-off
            raise self.retry(exc=exc, countdown=2 ** self.request.retries)
