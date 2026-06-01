import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse, after } from "next/server"
import { softClosePeriod, hardClosePeriod } from "@/lib/accounting/period-engine"
import { writeAudit, getClientIp } from "@/lib/audit"

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

    after(
      writeAudit({
        action: "PERIOD_CLOSE",
        entityType: "AccountingPeriod",
        entityId: params.id,
        actorId: session.user.id,
        actorEmail: session.user.email,
        organizationId: orgId,
        after: { status: period.status, closeType: type },
        details: { periodId: params.id, closeType: type },
        ipAddress: getClientIp(req),
      }).catch(console.error)
    )

    return NextResponse.json(period)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
