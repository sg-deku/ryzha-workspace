import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { runCommissionAgent } from "@/lib/agents/commission-agent"

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await runCommissionAgent(session.user.organizationId)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const result = await runCommissionAgent(session.user.organizationId)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
