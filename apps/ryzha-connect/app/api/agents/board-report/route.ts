import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { runBoardReportAgent } from "@/lib/agents/board-report-agent"

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await runBoardReportAgent(session.user.organizationId)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
