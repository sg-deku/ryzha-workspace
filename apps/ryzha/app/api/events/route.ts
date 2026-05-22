import { NextRequest } from "next/server"
import Redis from "ioredis"
import { localEmitter } from "@/lib/events"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get("orgId")

  if (!orgId) {
    return new Response("Missing orgId", { status: 400 })
  }

  const responseStream = new TransformStream()
  const writer = responseStream.writable.getWriter()
  const encoder = new TextEncoder()

  const channel = `org:${orgId}:events`

  // 1. Setup local emitter for in-memory fallback (works great for local dev)
  const handleLocalEvent = (message: string) => {
    writer.write(encoder.encode(`data: ${message}\n\n`))
  }
  localEmitter.on(channel, handleLocalEvent)

  // 2. Setup Redis subscriber (works for production/Vercel if configured)
  let subscriber: Redis | null = null
  
  try {
    subscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (!process.env.REDIS_URL) return null; // Don't retry if no URL provided
        return Math.min(times * 50, 2000);
      }
    })

    subscriber.subscribe(channel, (err) => {
      if (err) {
        console.warn("Failed to subscribe to Redis:", err.message)
      }
    })

    subscriber.on("message", (chan, message) => {
      if (chan === channel) {
        writer.write(encoder.encode(`data: ${message}\n\n`))
      }
    })
  } catch (e) {
    console.warn("Redis subscription error, using local emitter only")
  }

  req.signal.onabort = () => {
    if (subscriber) subscriber.quit()
    localEmitter.off(channel, handleLocalEvent)
    writer.close()
  }

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
