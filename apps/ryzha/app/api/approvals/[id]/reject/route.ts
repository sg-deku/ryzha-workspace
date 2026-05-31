import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { rejectRequest } from "@/lib/approvals/approval-engine"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { note } = await req.json().catch(() => ({ note: undefined }))

    const updated = await rejectRequest(
      session.user.organizationId,
      id,
      session.user.id,
      session.user.name ?? session.user.email ?? session.user.id,
      note
    )

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
