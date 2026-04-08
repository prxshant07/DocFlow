import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up DocFlow API...")
    try:
        # Import here to avoid circular imports and ensure settings are loaded first
        from app.core.database import engine, Base
        from app.api import documents, jobs, export

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")

    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    yield
    logger.info("Shutting down DocFlow API...")


app = FastAPI(
    title="DocFlow API",
    description="Async Document Processing Workflow System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Allow framing from any origin
@app.middleware("http")
async def add_frame_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "ALLOWALL"
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

# Import routers at module level (safe, no DB connection)
from app.api import documents, jobs, export

app.include_router(documents.router, prefix="/api/v1", tags=["documents"])
app.include_router(jobs.router, prefix="/api/v1", tags=["jobs"])
app.include_router(export.router, prefix="/api/v1", tags=["export"])


@app.get("/")
async def root():
    return {"message": "DocFlow API is running", "docs": "/docs"}


@app.get("/health")
async def health_check():
    """Health check endpoint for Railway deployment"""
    try:
        from app.core.database import check_db_connection
        from app.core.redis import check_redis_connection

        db_ok = await check_db_connection()
        redis_ok = await check_redis_connection()

        status = "healthy" if (db_ok and redis_ok) else "degraded"
        return {
            "status": status,
            "service": "docflow-api",
            "database": "connected" if db_ok else "disconnected",
            "redis": "connected" if redis_ok else "disconnected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "service": "docflow-api", "error": str(e)}
