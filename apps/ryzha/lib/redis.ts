import Redis from "ioredis"

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    // Stop retrying if no REDIS_URL is provided (assume local dev without redis)
    if (!process.env.REDIS_URL) return null;
    return Math.min(times * 50, 2000);
  }
})

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis
