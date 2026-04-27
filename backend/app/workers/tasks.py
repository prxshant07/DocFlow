"""
Celery worker tasks for document processing.

Each stage publishes progress events via Redis Pub/Sub.
The FastAPI backend subscribes and streams updates to the frontend via SSE.
"""

import json
import uuid
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


# ─── Real Document Processing Logic ────────────────────────────────────────────

CATEGORIES = ["Technical Report", "Research Paper", "Business Document", "Legal Contract", "Invoice", "Manual"]


def _extract_text_from_file(file_path: str) -> tuple[str, int]:
    """Extract raw text from a file based on its extension."""
    from pathlib import Path

    ext = Path(file_path).suffix.lower()
    text = ""

    try:
        if ext == ".pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(file_path)
                pages = [page.extract_text() for page in reader.pages]
                text = "\n".join(pages)
                page_count = len(reader.pages)
            except ImportError:
                # Fallback: try pdfplumber
                try:
                    import pdfplumber
                    with pdfplumber.open(file_path) as pdf:
                        pages = [page.extract_text() or "" for page in pdf.pages]
                        text = "\n".join(pages)
                        page_count = len(pdf.pages)
                except ImportError:
                    text = f"[PDF file: {Path(file_path).name} - install pypdf or pdfplumber for text extraction]"
                    page_count = 0
        elif ext in [".docx", ".doc"]:
            try:
                from docx import Document
                doc = Document(file_path)
                text = "\n".join([para.text for para in doc.paragraphs])
                page_count = 0  # DOCX doesn't have fixed pages
            except ImportError:
                text = f"[DOCX file: {Path(file_path).name} - install python-docx for text extraction]"
                page_count = 0
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            page_count = text.count("\n") // 50 + 1  # Estimate
        else:
            # Try to read as plain text
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            page_count = text.count("\n") // 50 + 1
    except Exception as e:
        text = f"[Error reading file: {str(e)}]"
        page_count = 0

    return text, page_count


def _parse_document(file_path: str, filename: str) -> dict:
    """Parse document and extract raw text with metadata."""
    text, page_count = _extract_text_from_file(file_path)
    word_count = len(text.split())

    # Detect language (simple heuristic)
    language = "English"  # Could use langdetect library
    if any(c in text for c in "àâçéèêëïîôùûüÿ"):
        language = "French"
    elif any(c in text for c in "äöüß"):
        language = "German"

    return {
        "text": text[:50000],  # Limit for extraction
        "page_count": page_count,
        "word_count": word_count,
        "language": language,
        "encoding": "UTF-8",
        "char_count": len(text),
    }


def _extract_structured_data(parse_result: dict, filename: str) -> dict:
    """Extract structured data from parsed text using heuristics."""
    text = parse_result.get("text", "")
    stem = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    # Generate title from first meaningful line or filename
    title = stem
    first_lines = [line.strip() for line in text.split("\n")[:10] if line.strip()]
    if first_lines:
        # Use first non-empty line as title if it's short
        candidate = first_lines[0]
        if len(candidate) < 100 and not candidate.startswith("http"):
            title = candidate

    # Simple category detection based on keywords
    text_lower = text.lower()
    if any(kw in text_lower for kw in ["invoice", "bill", "payment", "total due"]):
        category = "Invoice"
    elif any(kw in text_lower for kw in ["contract", "agreement", "parties", "hereby"]):
        category = "Legal Contract"
    elif any(kw in text_lower for kw in ["research", "study", "methodology", "results", "conclusion"]):
        category = "Research Paper"
    elif any(kw in text_lower for kw in ["technical", "implementation", "architecture", "system"]):
        category = "Technical Report"
    elif any(kw in text_lower for kw in ["manual", "guide", "instructions", "how to"]):
        category = "Manual"
    else:
        category = "Business Document"

    # Extract keywords (top frequent words, excluding common stop words)
    stop_words = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can", "this", "that", "these", "those", "it", "its", "as", "from", "into", "through", "during", "before", "after", "above", "below", "between", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "also"}
    words = [w.lower() for w in text.split() if w.isalpha() and len(w) > 3]
    word_freq = {}
    for w in words:
        if w not in stop_words:
            word_freq[w] = word_freq.get(w, 0) + 1
    keywords = sorted(word_freq.keys(), key=lambda x: word_freq[x], reverse=True)[:8]

    # Generate summary from first paragraph
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    summary = ""
    if paragraphs:
        first_para = paragraphs[0][:500]
        summary = f"This document appears to be a {category.lower()}. {first_para}"
    else:
        summary = f"Document: {title}. File contains {parse_result['word_count']:,} words across {parse_result['page_count']} pages."

    return {
        "title": title,
        "category": category,
        "summary": summary,
        "keywords": keywords if keywords else ["document"],
        "metadata": {k: v for k, v in parse_result.items() if k != "text"},
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

            # ── Stage 2: parsing_started ───────────────────────────────────
            job.current_stage = JobStage.parsing_started
            session.commit()

            _publish(job_id, document_id, "processing", "parsing_started",
                     "Parsing document content…", 15)

            parse_result = _parse_document(document.file_path, document.original_filename)

            # ── Stage 3: parsing_completed ─────────────────────────────────
            job.current_stage = JobStage.parsing_completed
            session.commit()

            _publish(job_id, document_id, "processing", "parsing_completed",
                     f"Parsed {parse_result['page_count']} pages, {parse_result['word_count']:,} words", 45)

            # ── Stage 4: extraction_started ────────────────────────────────
            job.current_stage = JobStage.extraction_started
            session.commit()

            _publish(job_id, document_id, "processing", "extraction_started",
                     "Running AI extraction pipeline…", 50)

            extract_result = _extract_structured_data(parse_result, document.original_filename)

            # ── Stage 5: extraction_completed ──────────────────────────────
            job.current_stage = JobStage.extraction_completed
            session.commit()

            _publish(job_id, document_id, "processing", "extraction_completed",
                     f"Extracted: '{extract_result['title']}'", 80)

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

