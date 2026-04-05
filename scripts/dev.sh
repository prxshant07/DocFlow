#!/usr/bin/env bash
# dev.sh — start all services for local development (no Docker)
# Requires: Python 3.12+, Node 22+, PostgreSQL, Redis running locally

set -e

BACKEND_DIR="$(dirname "$0")/backend"
FRONTEND_DIR="$(dirname "$0")/frontend"

export DATABASE_URL="postgresql+asyncpg://docflow:docflow@localhost:5432/docflow"
export DATABASE_URL_SYNC="postgresql://docflow:docflow@localhost:5432/docflow"
export REDIS_URL="redis://localhost:6379/0"
export CELERY_BROKER_URL="redis://localhost:6379/1"
export CELERY_RESULT_BACKEND="redis://localhost:6379/2"
export UPLOAD_DIR="/tmp/docflow/uploads"
export CORS_ORIGINS='["http://localhost:3000"]'
export DEBUG="true"

mkdir -p /tmp/docflow/uploads

echo "==> Starting FastAPI backend on :8000"
cd "$BACKEND_DIR"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "==> Starting Celery worker"
celery -A app.workers.celery_app worker --queues=documents,default --loglevel=info &
WORKER_PID=$!

echo "==> Starting Next.js frontend on :3000"
cd "$FRONTEND_DIR"
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 npm run dev &
FRONTEND_PID=$!

echo ""
echo "  DocFlow running:"
echo "  Frontend  → http://localhost:3000"
echo "  API       → http://localhost:8000"
echo "  API docs  → http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop all services."
echo ""

trap "kill $BACKEND_PID $WORKER_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
