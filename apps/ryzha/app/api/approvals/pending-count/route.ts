import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPendingCount } from "@/lib/approvals/approval-engine"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const count = await getPendingCount(session.user.organizationId)
  return NextResponse.json({ count })
}
