import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse, after } from "next/server"
import { reopenPeriod } from "@/lib/accounting/period-engine"
import { writeAudit, getClientIp } from "@/lib/audit"

export const dynamic = "force-dynamic"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const period = await reopenPeriod(session.user.organizationId, params.id, session.user.id)
    after(
      writeAudit({
        action: "PERIOD_REOPEN",
        entityType: "AccountingPeriod",
        entityId: params.id,
        actorId: session.user.id,
        actorEmail: session.user.email,
        organizationId: session.user.organizationId,
        after: { status: period.status },
        details: { periodId: params.id },
        ipAddress: getClientIp(_req),
      }).catch(console.error)
    )

    return NextResponse.json(period)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
