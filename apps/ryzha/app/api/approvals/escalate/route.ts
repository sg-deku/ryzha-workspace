import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { escalateOverdueRequests } from "@/lib/approvals/approval-engine"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const escalated = await escalateOverdueRequests(session.user.organizationId)
  return NextResponse.json({ escalated: escalated.length })
}
