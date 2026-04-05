# DocFlow — Async Document Processing Workflow System

A production-grade full-stack application for uploading documents, processing them asynchronously, tracking real-time progress, and reviewing extracted structured data.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (Next.js)                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────────────┐ │
│  │ Upload   │  │  Dashboard   │  │  Document Detail / Progress    │ │
│  │ page     │  │  (list,filter│  │  (SSE live updates, edit,      │ │
│  │          │  │   sort)      │  │   finalize, export)            │ │
│  └────┬─────┘  └──────┬───────┘  └──────────────┬─────────────────┘ │
│       │               │                          │ EventSource (SSE) │
└───────┼───────────────┼──────────────────────────┼───────────────────┘
        │ POST /upload  │ GET /documents            │ GET /progress/{id}
        ▼               ▼                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│  FastAPI (backend:8000)                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐│
│  │ /api/v1/     │  │  Service     │  │  SSE bridge                  ││
│  │ documents    │  │  Layer       │  │  subscribe_to_job()          ││
│  │ jobs         │  │              │  │  → async Redis PubSub        ││
│  │ export       │  │              │  │  → stream events to client   ││
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────────┘│
│         │ .delay()        │ SQLAlchemy async                          │
└─────────┼─────────────────┼──────────────────────────────────────────┘
          │                 │
          ▼                 ▼
  ┌──────────────┐   ┌─────────────┐   ┌────────────────────────────┐
  │  Redis       │   │ PostgreSQL  │   │  Celery Worker ×2          │
  │  DB1: broker │   │             │   │  process_document_task     │
  │  DB2: result │   │  documents  │   │                            │
  │  DB0: pubsub │   │  jobs       │   │  1. document_received      │
  │              │   │  extracted_ │   │  2. parsing_started        │
  │  PubSub      │◄──│  data       │   │  3. parsing_completed      │
  │  channel:    │   └─────────────┘   │  4. extraction_started     │
  │  job_progress│                     │  5. extraction_completed   │
  │  :{job_id}   │────────────────────►│  6. final_result_stored    │
  └──────────────┘  publish()         │  7. job_completed/failed   │
                                       └────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose v2
- (Optional) Node.js 22 + Python 3.12 for local dev

### Run with Docker

```bash
git clone https://github.com/yourname/docflow
cd docflow
docker compose up --build
```

Services:
| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| API      | http://localhost:8000        |
| API Docs | http://localhost:8000/docs   |
| Redis    | localhost:6379               |
| Postgres | localhost:5432               |

### Local Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql+asyncpg://docflow:docflow@localhost:5432/docflow"
export DATABASE_URL_SYNC="postgresql://docflow:docflow@localhost:5432/docflow"
export REDIS_URL="redis://localhost:6379/0"
export CELERY_BROKER_URL="redis://localhost:6379/1"
export CELERY_RESULT_BACKEND="redis://localhost:6379/2"

# Start API server
uvicorn app.main:app --reload --port 8000

# In a second terminal: start Celery worker
celery -A app.workers.celery_app worker --queues=documents,default --loglevel=info
```

**Frontend:**
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 npm run dev
```

---

## 📁 Project Structure

```
docflow/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── core/
│   │   │   ├── config.py         # Pydantic Settings (env vars)
│   │   │   ├── database.py       # Async SQLAlchemy engine + session DI
│   │   │   └── redis.py          # Redis pub/sub helpers
│   │   ├── models/
│   │   │   └── models.py         # Document, Job, ExtractedData ORM
│   │   ├── schemas/
│   │   │   └── schemas.py        # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── document_service.py
│   │   │   └── job_service.py
│   │   ├── workers/
│   │   │   ├── celery_app.py     # Celery configuration
│   │   │   └── tasks.py          # process_document_task (7 stages)
│   │   └── api/
│   │       ├── documents.py      # Upload, list, SSE, finalize, retry
│   │       ├── jobs.py           # Job status
│   │       └── export.py         # JSON/CSV export
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx           → redirect /dashboard
│       │   ├── dashboard/page.tsx  # Document list with full controls
│       │   ├── upload/page.tsx     # Drag-drop + live progress per file
│       │   └── documents/[id]/page.tsx  # Detail, edit, finalize, export
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Sidebar.tsx
│       │   │   └── StatusBadge.tsx
│       │   └── progress/
│       │       └── ProgressTracker.tsx  # SSE consumer
│       └── lib/
│           └── api.ts             # Full typed API client
└── docker-compose.yml
```

---

## 📡 API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/upload` | Upload files, enqueue jobs |
| `GET` | `/api/v1/documents` | List with search/filter/sort/paginate |
| `GET` | `/api/v1/documents/{id}` | Get single document with job + data |
| `GET` | `/api/v1/progress/{job_id}` | **SSE stream** of progress events |
| `PUT` | `/api/v1/documents/{id}/extracted` | Edit extracted fields |
| `POST` | `/api/v1/finalize/{id}` | Mark as reviewed & finalized |
| `POST` | `/api/v1/retry/{id}` | Retry a failed job |
| `GET` | `/api/v1/export/{id}?format=json\|csv` | Export extracted data |
| `DELETE` | `/api/v1/documents/{id}` | Delete document + file |
| `GET` | `/api/v1/jobs/{id}` | Get job by ID |

### SSE Progress Event Schema

```json
{
  "job_id": "uuid",
  "document_id": "uuid",
  "status": "processing | job_completed | job_failed",
  "stage": "parsing_started | extraction_completed | ...",
  "message": "Human-readable status message",
  "progress_pct": 45,
  "timestamp": "2024-01-15T10:30:00Z",
  "error": null
}
```

### Job Stages & Progress

| Stage | % |
|-------|---|
| `document_received` | 5 |
| `parsing_started` | 15 |
| `parsing_completed` | 45 |
| `extraction_started` | 50 |
| `extraction_completed` | 80 |
| `final_result_stored` | 95 |
| `job_completed` | 100 |

---

## 🗄️ Database Schema

```sql
-- documents
CREATE TABLE documents (
  id               VARCHAR(36)  PRIMARY KEY,
  filename         VARCHAR(512) NOT NULL,        -- stored filename (uuid + ext)
  original_filename VARCHAR(512) NOT NULL,        -- user's original filename
  file_type        VARCHAR(128) NOT NULL,
  file_size        INTEGER      NOT NULL,
  file_path        VARCHAR(1024) NOT NULL,
  upload_timestamp TIMESTAMP    DEFAULT NOW(),
  is_finalized     BOOLEAN      DEFAULT FALSE
);

-- jobs
CREATE TABLE jobs (
  id              VARCHAR(36)  PRIMARY KEY,
  document_id     VARCHAR(36)  REFERENCES documents(id) ON DELETE CASCADE,
  celery_task_id  VARCHAR(256),
  status          VARCHAR(20)  DEFAULT 'queued',   -- queued/processing/completed/failed
  current_stage   VARCHAR(50),
  error_message   TEXT,
  created_at      TIMESTAMP    DEFAULT NOW(),
  started_at      TIMESTAMP,
  completed_at    TIMESTAMP,
  retry_count     INTEGER      DEFAULT 0
);

-- extracted_data
CREATE TABLE extracted_data (
  id          VARCHAR(36) PRIMARY KEY,
  document_id VARCHAR(36) UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
  title       VARCHAR(512),
  category    VARCHAR(128),
  summary     TEXT,
  keywords    JSONB,
  raw_json    JSONB,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

---

## ⚙️ Configuration

All configuration is via environment variables (see `backend/app/core/config.py`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | postgres async URL | Async DB URL for FastAPI |
| `DATABASE_URL_SYNC` | postgres sync URL | Sync URL for Celery workers |
| `REDIS_URL` | `redis://redis:6379/0` | PubSub + general Redis |
| `CELERY_BROKER_URL` | `redis://redis:6379/1` | Celery task queue |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/2` | Celery results |
| `UPLOAD_DIR` | `/tmp/docflow/uploads` | File storage path |
| `MAX_FILE_SIZE_MB` | `50` | Max upload size |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |

---

## 🔧 Scaling

**Scale Celery workers:**
```bash
docker compose up --scale worker=4
```

**Monitoring (add to docker-compose):**
```yaml
flower:
  image: mher/flower:2.0
  command: celery flower --broker=redis://redis:6379/1
  ports: ["5555:5555"]
  depends_on: [redis]
```

---

## 🏛️ Architecture Decisions & Trade-offs

### Why Server-Sent Events over WebSockets?
SSE is unidirectional (server → client), which is exactly what progress tracking needs. It works over plain HTTP, requires no protocol upgrade, and is natively supported by browsers via `EventSource`. WebSockets would be appropriate if bidirectional communication were needed.

### Why separate Redis databases for broker/backend/pubsub?
Isolation prevents Celery's task management keys from interfering with pub/sub channels, and allows different eviction policies per database.

### Why synchronous SQLAlchemy in Celery workers?
Celery tasks run in a sync context. Using `asyncpg` would require an event loop per task. The synchronous `psycopg2` driver is simpler and avoids event loop management complexity in workers.

### Why store files on disk vs object storage?
Disk storage is used for simplicity. In production, replace with S3/GCS by updating `document_service.py`'s `save_upload()` method. The `file_path` column is already abstracted for this.

### Assumptions
- Document "processing" is simulated with `time.sleep()`. Replace `_simulate_parse()` and `_simulate_extract()` in `tasks.py` with real ML/NLP logic.
- No authentication. Add JWT middleware to FastAPI and user_id FK on documents for multi-tenant use.
- Single-region deployment. For multi-region, replace the shared upload volume with object storage.

### Known Limitations
- No rate limiting on uploads
- File type validation is MIME-type only (not magic bytes)
- SSE connections will be dropped and not resumed if the server restarts mid-job (mitigated by polling fallback on the detail page)
- No dead-letter queue for permanently failed Celery tasks

---

## 🧪 Testing

```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

Key test areas:
- Upload → job enqueue flow
- Celery task stage transitions
- Redis pub/sub event delivery
- SSE endpoint streaming
- Export format correctness
