import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


class JobStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class JobStage(str, enum.Enum):
    document_received = "document_received"
    parsing_started = "parsing_started"
    parsing_completed = "parsing_completed"
    extraction_started = "extraction_started"
    extraction_completed = "extraction_completed"
    final_result_stored = "final_result_stored"
    job_completed = "job_completed"
    job_failed = "job_failed"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(128), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    upload_timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_finalized: Mapped[bool] = mapped_column(default=False)

    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="document", uselist=False, cascade="all, delete-orphan")
    extracted_data: Mapped["ExtractedData"] = relationship("ExtractedData", back_populates="document", uselist=False, cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    celery_task_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus), default=JobStatus.queued)
    current_stage: Mapped[JobStage | None] = mapped_column(SAEnum(JobStage), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="job")


class ExtractedData(Base):
    __tablename__ = "extracted_data"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True)
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    keywords: Mapped[list | None] = mapped_column(JSON, nullable=True)
    raw_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="extracted_data")
