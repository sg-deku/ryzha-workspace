import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { delegateRequest } from "@/lib/approvals/approval-engine"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { delegateToId, delegateToName, note } = await req.json()

    if (!delegateToId || !delegateToName) {
      return NextResponse.json({ error: "delegateToId and delegateToName are required" }, { status: 400 })
    }

    const result = await delegateRequest(
      session.user.organizationId,
      id,
      delegateToId,
      delegateToName,
      note
    )

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
