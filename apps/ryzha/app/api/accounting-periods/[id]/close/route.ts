import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { softClosePeriod, hardClosePeriod } from "@/lib/accounting/period-engine"

export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { type } = await req.json()
    const orgId = session.user.organizationId
    const userId = session.user.id

    let period
    if (type === "HARD_CLOSE") {
      period = await hardClosePeriod(orgId, params.id, userId)
    } else {
      period = await softClosePeriod(orgId, params.id, userId)
    }

    return NextResponse.json(period)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
