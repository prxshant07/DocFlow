"""
Integration tests for the DocFlow API.

Run with:
  pytest tests/ -v --asyncio-mode=auto

Requires a running PostgreSQL + Redis (use docker compose or set env vars).
"""

import io
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import engine, Base


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


class TestUpload:
    async def test_upload_single_file(self, client: AsyncClient):
        content = b"Hello, DocFlow! This is a test document."
        files = {"files": ("test.txt", io.BytesIO(content), "text/plain")}
        response = await client.post("/api/v1/upload", files=files)

        assert response.status_code == 201
        data = response.json()
        assert len(data) == 1
        doc = data[0]
        assert doc["original_filename"] == "test.txt"
        assert doc["file_type"] == "text/plain"
        assert doc["file_size"] == len(content)
        assert doc["is_finalized"] is False
        assert doc["job"] is not None
        assert doc["job"]["status"] == "queued"

    async def test_upload_multiple_files(self, client: AsyncClient):
        files = [
            ("files", ("a.txt", io.BytesIO(b"file a"), "text/plain")),
            ("files", ("b.txt", io.BytesIO(b"file b"), "text/plain")),
        ]
        response = await client.post("/api/v1/upload", files=files)
        assert response.status_code == 201
        assert len(response.json()) == 2

    async def test_upload_no_files(self, client: AsyncClient):
        response = await client.post("/api/v1/upload")
        assert response.status_code == 422


class TestDocumentList:
    async def test_list_empty(self, client: AsyncClient):
        response = await client.get("/api/v1/documents")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_after_upload(self, client: AsyncClient):
        files = {"files": ("sample.pdf", io.BytesIO(b"pdf content"), "application/pdf")}
        await client.post("/api/v1/upload", files=files)

        response = await client.get("/api/v1/documents")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["original_filename"] == "sample.pdf"

    async def test_search_filter(self, client: AsyncClient):
        for name in ["report.pdf", "invoice.pdf", "summary.txt"]:
            files = {"files": (name, io.BytesIO(b"content"), "text/plain")}
            await client.post("/api/v1/upload", files=files)

        response = await client.get("/api/v1/documents?search=invoice")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["original_filename"] == "invoice.pdf"

    async def test_status_filter(self, client: AsyncClient):
        files = {"files": ("x.txt", io.BytesIO(b"x"), "text/plain")}
        await client.post("/api/v1/upload", files=files)

        response = await client.get("/api/v1/documents?status=queued")
        assert response.status_code == 200
        assert response.json()["total"] >= 1


class TestDocumentDetail:
    async def test_get_document(self, client: AsyncClient):
        files = {"files": ("detail.txt", io.BytesIO(b"hello"), "text/plain")}
        upload = (await client.post("/api/v1/upload", files=files)).json()
        doc_id = upload[0]["id"]

        response = await client.get(f"/api/v1/documents/{doc_id}")
        assert response.status_code == 200
        assert response.json()["id"] == doc_id

    async def test_get_nonexistent(self, client: AsyncClient):
        response = await client.get("/api/v1/documents/does-not-exist")
        assert response.status_code == 404


class TestRetry:
    async def test_retry_non_failed_job_rejected(self, client: AsyncClient):
        files = {"files": ("r.txt", io.BytesIO(b"retry test"), "text/plain")}
        upload = (await client.post("/api/v1/upload", files=files)).json()
        doc_id = upload[0]["id"]

        response = await client.post(f"/api/v1/retry/{doc_id}")
        assert response.status_code == 400
        assert "failed" in response.json()["detail"].lower()


class TestExport:
    async def test_export_no_data(self, client: AsyncClient):
        files = {"files": ("exp.txt", io.BytesIO(b"export me"), "text/plain")}
        upload = (await client.post("/api/v1/upload", files=files)).json()
        doc_id = upload[0]["id"]

        response = await client.get(f"/api/v1/export/{doc_id}?format=json")
        assert response.status_code == 400
