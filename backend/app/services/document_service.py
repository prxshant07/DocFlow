import os
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.models import Document, Job, ExtractedData, JobStatus
from app.schemas.schemas import DocumentListItem, DocumentResponse, ExtractedDataUpdate


class DocumentService:

    async def save_upload(self, file: UploadFile, db: AsyncSession) -> Document:
        """Persist uploaded file to disk and create Document + Job records."""
        # Validate file size
        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB"
            )

        # Create upload directory
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename to avoid collisions
        file_id = str(uuid.uuid4())
        extension = Path(file.filename).suffix
        stored_filename = f"{file_id}{extension}"
        file_path = upload_dir / stored_filename

        # Write file to disk
        with open(file_path, "wb") as f:
            f.write(content)

        # Determine MIME type
        content_type = file.content_type or "application/octet-stream"

        # Create Document record
        document = Document(
            id=file_id,
            filename=stored_filename,
            original_filename=file.filename,
            file_type=content_type,
            file_size=len(content),
            file_path=str(file_path),
            upload_timestamp=datetime.utcnow(),
        )
        db.add(document)

        # Create associated Job record
        job = Job(
            document_id=document.id,
            status=JobStatus.queued,
        )
        db.add(job)
        await db.flush()

        # Pre-load job relationship to avoid lazy-load in async context
        await db.refresh(document, attribute_names=["job"])

        return document

    async def get_document(self, document_id: str, db: AsyncSession) -> Document:
        result = await db.execute(
            select(Document)
            .options(
                selectinload(Document.job),
                selectinload(Document.extracted_data),
            )
            .where(Document.id == document_id)
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        return doc

    async def list_documents(
        self,
        db: AsyncSession,
        search: str | None = None,
        status: str | None = None,
        sort_by: str = "upload_timestamp",
        order: str = "desc",
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Document], int]:
        query = (
            select(Document)
            .options(selectinload(Document.job))
            .offset(offset)
            .limit(limit)
        )

        # Filter by status through the job relationship
        if status:
            query = query.join(Document.job).where(Job.status == status)

        # Search by filename
        if search:
            query = query.where(Document.original_filename.ilike(f"%{search}%"))

        # Sorting
        sort_col = getattr(Document, sort_by, Document.upload_timestamp)
        if order == "asc":
            query = query.order_by(sort_col.asc())
        else:
            query = query.order_by(sort_col.desc())

        result = await db.execute(query)
        documents = result.scalars().all()

        # Count total for pagination
        count_query = select(Document)
        if status:
            count_query = count_query.join(Document.job).where(Job.status == status)
        if search:
            count_query = count_query.where(Document.original_filename.ilike(f"%{search}%"))

        count_result = await db.execute(count_query)
        total = len(count_result.scalars().all())

        return list(documents), total

    async def update_extracted_data(
        self,
        document_id: str,
        update: ExtractedDataUpdate,
        db: AsyncSession,
    ) -> ExtractedData:
        result = await db.execute(
            select(ExtractedData).where(ExtractedData.document_id == document_id)
        )
        extracted = result.scalar_one_or_none()
        if not extracted:
            raise HTTPException(status_code=404, detail="Extracted data not found. Job may not be complete.")

        for field, value in update.model_dump(exclude_unset=True).items():
            setattr(extracted, field, value)
        extracted.updated_at = datetime.utcnow()

        return extracted

    async def finalize_document(self, document_id: str, db: AsyncSession) -> Document:
        doc = await self.get_document(document_id, db)
        if not doc.extracted_data:
            raise HTTPException(status_code=400, detail="Cannot finalize: processing not complete")
        doc.is_finalized = True
        return doc

    async def delete_document(self, document_id: str, db: AsyncSession) -> None:
        doc = await self.get_document(document_id, db)
        # Remove file from disk
        try:
            if os.path.exists(doc.file_path):
                os.remove(doc.file_path)
        except OSError:
            pass  # Log in production
        await db.delete(doc)


document_service = DocumentService()
