import { redis } from "./redis"
import { EventEmitter } from "events"

const globalForEvents = globalThis as unknown as {
  eventEmitter: EventEmitter | undefined
}

export const localEmitter = globalForEvents.eventEmitter ?? new EventEmitter()

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventEmitter = localEmitter
}

export async function publishEvent(channel: string, data: any) {
  // Always emit locally for in-memory fallback
  localEmitter.emit(channel, JSON.stringify(data))
  
  // Try to publish to Redis if it's connected/configured
  if (redis.status === "ready" || process.env.REDIS_URL) {
    try {
      await redis.publish(channel, JSON.stringify(data))
    } catch (e) {
      console.warn("Redis publish failed, falling back to local emitter")
    }
  }
}
