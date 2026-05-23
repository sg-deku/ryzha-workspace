import { NextRequest } from "next/server"
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

  // Setup local emitter for in-memory events
  const handleLocalEvent = (message: string) => {
    writer.write(encoder.encode(`data: ${message}\n\n`))
  }
  localEmitter.on(channel, handleLocalEvent)

  req.signal.onabort = () => {
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
