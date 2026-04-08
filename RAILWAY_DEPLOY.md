# Railway Deployment Guide for DocFlow

## ⚠️ Important Architecture Note

DocFlow requires **3 separate services** to run:
1. **FastAPI Backend** - Main API server
2. **Celery Worker** - Background job processor
3. **PostgreSQL + Redis** - Database and message broker

Railway deploys one service per deployment. You have two options:

---

## Option A: Deploy Backend Only (API without job processing)

For a simple deployment without document processing:

### 1. Add Services in Railway
1. Create a new Project
2. Add **PostgreSQL** database
3. Add **Redis** service
4. Deploy your GitHub repo (backend)

### 2. Set Environment Variables
In Railway Variables tab, set:

```bash
# Database (use Railway's PostgreSQL internal URL)
DATABASE_URL=postgresql+asyncpg://${{Postgres.USER}}:${{Postgres.PASSWORD}}@${{Postgres.HOST}}:${{Postgres.PORT}}/${{Postgres.DATABASE}}
DATABASE_URL_SYNC=postgresql://${{Postgres.USER}}:${{Postgres.PASSWORD}}@${{Postgres.HOST}}:${{Postgres.PORT}}/${{Postgres.DATABASE}}

# Redis (use Railway's Redis internal URL)
REDIS_URL=redis://${{Redis.HOST}}:${{Redis.PORT}}/0
CELERY_BROKER_URL=redis://${{Redis.HOST}}:${{Redis.PORT}}/1
CELERY_RESULT_BACKEND=redis://${{Redis.HOST}}:${{Redis.PORT}}/2

# App
UPLOAD_DIR=/tmp/docflow/uploads
MAX_FILE_SIZE_MB=50
DEBUG=false
CORS_ORIGINS=["*"]
```

### 3. Deploy
- Push changes to GitHub
- Railway will auto-deploy
- Check logs in Railway dashboard

---

## Option B: Full Deployment (Backend + Worker)

Deploy both the API and Celery worker as separate Railway services:

### Service 1: Backend API
1. Deploy `backend/` directory
2. Set environment variables as above
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Service 2: Celery Worker
1. Deploy `backend/` directory again (as a separate service)
2. Set same environment variables
3. Start command:
```bash
celery -A app.workers.celery_app worker --queues=documents,default --concurrency=4 --loglevel=info
```

---

## Troubleshooting 502 Errors

### Check 1: Health Endpoint
Visit `https://your-domain.railway.app/health` to check if the API is running.

### Check 2: Railway Logs
Open Railway dashboard → Logs tab → Look for:
- `Database connection failed` - PostgreSQL not configured
- `Error connecting to Redis` - Redis not configured
- `Address already in use` - Port conflict

### Check 3: Environment Variables
Make sure all variables are set correctly in Railway's Variables tab.

### Check 4: Startup Command
Railway should run:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## Frontend Deployment

The frontend is a separate Next.js app. Deploy it as:

1. **Option 1**: Deploy to Vercel (recommended for Next.js)
   ```bash
   cd frontend
   vercel deploy
   ```
   Set `NEXT_PUBLIC_API_URL` to your Railway backend URL.

2. **Option 2**: Deploy to Railway as a separate service
   - Change `railway.json` to point to `frontend/Dockerfile`
   - Set `NEXT_PUBLIC_API_URL` to your backend URL

---

## Quick Fix for 502

If you're seeing 502 right now:

1. Go to Railway dashboard
2. Click your deployment
3. Go to **Deployments** tab
4. Click the latest deployment
5. Check **Logs** for errors
6. Common fixes:
   - Add PostgreSQL service
   - Add Redis service  
   - Set all environment variables from above
   - Restart deployment
