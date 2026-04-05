from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import Job, Document, JobStatus
from app.schemas.schemas import JobResponse


class JobService:

    async def get_job(self, job_id: str, db: AsyncSession) -> Job:
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job

    async def get_job_by_document(self, document_id: str, db: AsyncSession) -> Job:
        result = await db.execute(
            select(Job).where(Job.document_id == document_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found for this document")
        return job

    async def mark_job_started(self, job: Job, celery_task_id: str, db: AsyncSession) -> Job:
        job.status = JobStatus.processing
        job.celery_task_id = celery_task_id
        job.started_at = datetime.utcnow()
        return job

    async def mark_job_failed(self, job: Job, error: str, db: AsyncSession) -> Job:
        job.status = JobStatus.failed
        job.error_message = error
        job.completed_at = datetime.utcnow()
        return job

    async def retry_job(self, document_id: str, db: AsyncSession) -> Job:
        """Reset a failed job to queued state and enqueue a new Celery task."""
        # Import here to avoid circular imports
        from app.workers.tasks import process_document_task

        result = await db.execute(
            select(Job).where(Job.document_id == document_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if job.status != JobStatus.failed:
            raise HTTPException(
                status_code=400,
                detail=f"Can only retry failed jobs. Current status: {job.status.value}"
            )

        # Reset job state
        job.status = JobStatus.queued
        job.error_message = None
        job.current_stage = None
        job.celery_task_id = None
        job.started_at = None
        job.completed_at = None
        job.retry_count += 1
        await db.flush()

        # Enqueue Celery task
        task = process_document_task.delay(document_id, job.id)
        job.celery_task_id = task.id

        return job


job_service = JobService()
