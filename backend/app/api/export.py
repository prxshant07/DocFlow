import csv
import json
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.document_service import document_service

router = APIRouter()


@router.get("/export/{document_id}")
async def export_document(
    document_id: str,
    format: str = Query("json", regex="^(json|csv)$"),
    db: AsyncSession = Depends(get_db),
):
    """Export extracted data as JSON or CSV."""
    doc = await document_service.get_document(document_id, db)
    if not doc.extracted_data:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="No extracted data available for export")

    ext = doc.extracted_data
    filename_stem = doc.original_filename.rsplit(".", 1)[0]

    if format == "json":
        payload = {
            "document_id": doc.id,
            "original_filename": doc.original_filename,
            "upload_timestamp": doc.upload_timestamp.isoformat(),
            "is_finalized": doc.is_finalized,
            "extracted_data": {
                "title": ext.title,
                "category": ext.category,
                "summary": ext.summary,
                "keywords": ext.keywords,
            },
        }
        return JSONResponse(
            content=payload,
            headers={
                "Content-Disposition": f'attachment; filename="{filename_stem}.json"'
            },
        )

    elif format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Field", "Value"])
        writer.writerow(["document_id", doc.id])
        writer.writerow(["original_filename", doc.original_filename])
        writer.writerow(["upload_timestamp", doc.upload_timestamp.isoformat()])
        writer.writerow(["is_finalized", doc.is_finalized])
        writer.writerow(["title", ext.title or ""])
        writer.writerow(["category", ext.category or ""])
        writer.writerow(["summary", ext.summary or ""])
        writer.writerow(["keywords", ", ".join(ext.keywords or [])])
        output.seek(0)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename_stem}.csv"'
            },
        )
