from fastapi import APIRouter, Depends, File, UploadFile, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import Base
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.redis import subscribe_to_job
from app.models.models import User
from app.services.document_service import document_service
from app.services.job_service import job_service
from app.schemas.schemas import (
    DocumentResponse, DocumentListItem,
    ExtractedDataUpdate, ExtractedDataResponse,
    JobResponse,
)
from app.workers.tasks import process_document_task

router = APIRouter()


@router.post("/upload", response_model=list[DocumentResponse], status_code=201)
async def upload_documents(
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload one or more documents and enqueue processing jobs."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    results = []
    for file in files:
        doc = await document_service.save_upload(file, db, current_user.id)
        await db.flush()

        # Enqueue Celery task AFTER the record is flushed
        task = process_document_task.delay(doc.id, doc.job.id)

        # Store celery task ID on the job
        doc.job.celery_task_id = task.id
        results.append(doc)

    await db.commit()

    # Re-fetch with all relations loaded
    loaded = []
    for doc in results:
        loaded.append(await document_service.get_document(doc.id, db))

    return loaded


@router.get("/documents", response_model=dict)
async def list_documents(
    search: str | None = Query(None),
    status: str | None = Query(None),
    sort_by: str = Query("upload_timestamp", regex="^(upload_timestamp|original_filename|file_size)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all documents with search, filter, and sort support."""
    docs, total = await document_service.list_documents(
        db, 
        user_id = current_user.id,
        search=search, 
        status=status,
        sort_by=sort_by, 
        order=order, 
        limit=limit, 
        offset=offset
    )
    return {
        "items": [DocumentListItem.model_validate(d) for d in docs],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Get a single document with its job status and extracted data."""
    doc = await document_service.get_document(document_id, db)
    # TODO: Add authorization check to ensure user owns the document
    return doc


@router.get("/progress/{job_id}")
async def stream_job_progress(
    job_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Server-Sent Events endpoint for real-time job progress.
    Token is passed as query param because EventSource can't send headers.
    """
    from jose import JWTError
    from app.core.security import verify_token

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise credentials_exception

    job = await job_service.get_job(job_id, db)

    async def event_generator():
        async for event in subscribe_to_job(job_id):
            import json
            yield f"data: {json.dumps(event)}\n\n"
            if event.get("status") in ("job_completed", "job_failed"):
                break
        yield "data: {\"status\": \"stream_closed\"}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.put("/documents/{document_id}/extracted", response_model=ExtractedDataResponse)
async def update_extracted_data(
    document_id: str,
    update: ExtractedDataUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Edit the extracted structured data before finalization."""
    extracted = await document_service.update_extracted_data(document_id, update, db)
    # TODO: Add authorization check to ensure user owns the document
    await db.commit()
    await db.refresh(extracted)
    return extracted


@router.post("/finalize/{document_id}", response_model=DocumentResponse)
async def finalize_document(document_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Mark a document as reviewed and finalized."""
    doc = await document_service.finalize_document(document_id, db)
    # TODO: Add authorization check to ensure user owns the document
    await db.commit()
    return await document_service.get_document(document_id, db)


@router.post("/retry/{document_id}", response_model=JobResponse)
async def retry_job(document_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Retry a failed processing job."""
    job = await job_service.retry_job(document_id, current_user.id, db)
    await db.commit()
    return job


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Delete a document and its associated data."""
    await document_service.delete_document(document_id, db)
    # TODO: Add authorization check to ensure user owns the document
    await db.commit()
