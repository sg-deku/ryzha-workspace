import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { runMonthlyDepreciation } from "@/lib/fixed-assets/depreciation-engine"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { period } = await req.json()
    const periodDate = period ? new Date(period) : new Date()

    const result = await runMonthlyDepreciation(session.user.organizationId, periodDate)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
