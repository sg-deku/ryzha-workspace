import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { messages } = await req.json()

    const chatRes = await fetch(new URL("/api/chat", req.url).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `__Secure-next-auth.session-token=mobile`,
        "x-mobile-org-id": session.organizationId,
        "x-mobile-user-id": session.id,
      },
      body: JSON.stringify({ messages }),
    })

    if (!chatRes.ok) {
      return NextResponse.json({ error: "Chat unavailable" }, { status: 502 })
    }

    return chatRes
  } catch (err) {
    console.error("[mobile/chat]", err)
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 })
  }
}
