from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Any
from app.models.models import JobStatus, JobStage


# ── Document Schemas ──────────────────────────────────────────────────────────

class DocumentBase(BaseModel):
    filename: str
    original_filename: str
    file_type: str
    file_size: int


class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    upload_timestamp: datetime
    is_finalized: bool
    job: "JobResponse | None" = None
    extracted_data: "ExtractedDataResponse | None" = None


class DocumentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    original_filename: str
    file_type: str
    file_size: int
    upload_timestamp: datetime
    is_finalized: bool
    job: "JobSummary | None" = None


# ── Job Schemas ───────────────────────────────────────────────────────────────

class JobSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: JobStatus
    current_stage: JobStage | None = None
    created_at: datetime
    retry_count: int


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    celery_task_id: str | None = None
    status: JobStatus
    current_stage: JobStage | None = None
    error_message: str | None = None
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    retry_count: int


# ── Extracted Data Schemas ────────────────────────────────────────────────────

class ExtractedDataBase(BaseModel):
    title: str | None = None
    category: str | None = None
    summary: str | None = None
    keywords: list[str] | None = None


class ExtractedDataUpdate(ExtractedDataBase):
    pass


class ExtractedDataResponse(ExtractedDataBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    raw_json: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime


# ── Progress Event Schemas ────────────────────────────────────────────────────

class ProgressEvent(BaseModel):
    job_id: str
    document_id: str
    status: str
    stage: str | None = None
    message: str
    progress_pct: int
    timestamp: str
    error: str | None = None


# ── Export Schemas ────────────────────────────────────────────────────────────

class ExportFormat(str):
    JSON = "json"
    CSV = "csv"
