# Railway Deployment Guide

## Overview

DocFlow deploys to Railway as three separate services:
1. **Backend** (FastAPI) - Web server + API
2. **Worker** (Celery) - Background document processing
3. **Frontend** (Next.js) - Web UI

Plus managed PostgreSQL and Redis.

---

## Step 1: Deploy to Railway

### Option A: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init --name docflow

# Add PostgreSQL
railway add postgres

# Add Redis
railway add redis
```

### Option B: Deploy via Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub repository

---

## Step 2: Deploy Backend Service

```bash
# Create backend service
railway service create --name backend

# Link to your project
railway link

# Set environment variables
railway variables set --service backend \
  PORT=8000 \
  DATABASE_URL=$Postgres.DATABASE_URL \
  REDIS_URL=$Redis.REDIS_URL \
  CELERY_BROKER_URL="redis://$Redis.REDIS_HOST:$Redis.REDIS_PORT/1" \
  CELERY_RESULT_BACKEND="redis://$Redis.REDIS_HOST:$Redis.REDIS_PORT/2" \
  CORS_ORIGINS='["*"]' \
  DEBUG="false"
```

**Backend Dockerfile path:** `backend/Dockerfile`

---

## Step 3: Deploy Worker Service

```bash
# Create worker service (uses same Dockerfile as backend)
railway service create --name worker

# Set environment variables
railway variables set --service worker \
  DATABASE_URL_SYNC=$Postgres.DATABASE_URL \
  REDIS_URL=$Redis.REDIS_URL \
  CELERY_BROKER_URL="redis://$Redis.REDIS_HOST:$Redis.REDIS_PORT/1" \
  CELERY_RESULT_BACKEND="redis://$Redis.REDIS_HOST:$Redis.REDIS_PORT/2"
```

**Worker start command:** `celery -A app.workers.celery_app worker --queues=documents,default --concurrency=4 --loglevel=info`

---

## Step 4: Deploy Frontend Service

```bash
# Create frontend service
railway service create --name frontend

# Get the backend service URL
BACKEND_URL=$(railway service --service backend --url)

# Set environment variables
railway variables set --service frontend \
  NEXT_PUBLIC_API_URL="$BACKEND_URL/api/v1" \
  NODE_ENV="production"
```

**Frontend Dockerfile path:** `frontend/Dockerfile`

---

## Step 5: Configure Domain (Optional)

```bash
# Add custom domain
railway domain set docflow.yourdomain.com --service frontend
```

Update `CORS_ORIGINS` in backend to include your domain:
```bash
railway variables set --service backend CORS_ORIGINS='["https://docflow.yourdomain.com"]'
```

---

## Environment Variables Summary

### Backend
| Variable | Value |
|----------|-------|
| `PORT` | `8000` |
| `DATABASE_URL` | `$Postgres.DATABASE_URL` |
| `REDIS_URL` | `$Redis.REDIS_URL` |
| `CELERY_BROKER_URL` | `redis://$Redis.REDIS_HOST:$Redis.REDIS_PORT/1` |
| `CELERY_RESULT_BACKEND` | `redis://$Redis.REDIS_HOST:$Redis.REDIS_PORT/2` |
| `CORS_ORIGINS` | `["*"]` (or your domain) |

### Worker
| Variable | Value |
|----------|-------|
| `DATABASE_URL_SYNC` | `$Postgres.DATABASE_URL` |
| `REDIS_URL` | `$Redis.REDIS_URL` |
| `CELERY_BROKER_URL` | `redis://$Redis.REDIS_HOST:$Redis.REDIS_PORT/1` |
| `CELERY_RESULT_BACKEND` | `redis://$Redis.REDIS_HOST:$Redis.REDIS_PORT/2` |

### Frontend
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `<backend-service-url>/api/v1` |
| `NODE_ENV` | `production` |

---

## Verify Deployment

1. **Health check:** `https://<backend-url>/health`
2. **API docs:** `https://<backend-url>/docs`
3. **Frontend:** `https://<frontend-url>`

---

## Troubleshooting

### Backend not reachable
- Check that `PORT` env var is set to `8000`
- Verify health check path `/health` is responding
- Check Railway logs for startup errors

### CORS errors
- Ensure `CORS_ORIGINS` includes your frontend URL
- For development, `["*"]` works but restrict in production

### Worker not processing
- Verify Redis connection
- Check worker logs in Railway dashboard
- Ensure `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` are correct

### Database connection failed
- Ensure PostgreSQL service is linked
- Verify `DATABASE_URL` contains correct credentials

---

## Scaling

- **Workers:** Scale in Railway dashboard or `railway scale set worker --replicas=4`
- **Backend:** Railway auto-scales based on load
