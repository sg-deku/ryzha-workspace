import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { generateFiscalPeriods } from "@/lib/accounting/period-engine"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { fiscalYear } = await req.json()
    if (!fiscalYear || typeof fiscalYear !== "number") {
      return NextResponse.json({ error: "fiscalYear is required" }, { status: 400 })
    }

    const periods = await generateFiscalPeriods(session.user.organizationId, fiscalYear)
    return NextResponse.json(periods)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
