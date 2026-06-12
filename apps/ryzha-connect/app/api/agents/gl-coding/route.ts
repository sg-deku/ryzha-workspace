import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { runGLCodingAgent } from "@/lib/agents/gl-coding-agent"

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await runGLCodingAgent(session.user.organizationId)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
