import redis.asyncio as aioredis
import json
from typing import AsyncGenerator

from app.core.config import settings

_redis_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_pool


async def publish_progress(job_id: str, event: dict) -> None:
    """Publish a progress event to Redis Pub/Sub channel for a job."""
    redis = await get_redis()
    channel = f"{settings.REDIS_PUBSUB_CHANNEL_PREFIX}{job_id}"
    await redis.publish(channel, json.dumps(event))


async def subscribe_to_job(job_id: str) -> AsyncGenerator[dict, None]:
    """Subscribe to a job's progress channel and yield events."""
    redis = await get_redis()
    pubsub = redis.pubsub()
    channel = f"{settings.REDIS_PUBSUB_CHANNEL_PREFIX}{job_id}"

    await pubsub.subscribe(channel)
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    yield data
                    # Stop listening once terminal state is reached
                    if data.get("status") in ("job_completed", "job_failed"):
                        break
                except (json.JSONDecodeError, KeyError):
                    continue
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()
