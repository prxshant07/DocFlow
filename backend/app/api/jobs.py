from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.job_service import job_service
from app.schemas.schemas import JobResponse

router = APIRouter()


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Get the current state of a job."""
    job = await job_service.get_job(job_id, db)
    return job
