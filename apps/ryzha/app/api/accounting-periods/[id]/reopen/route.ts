import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { reopenPeriod } from "@/lib/accounting/period-engine"

export const dynamic = "force-dynamic"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const period = await reopenPeriod(session.user.organizationId, params.id, session.user.id)
    return NextResponse.json(period)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
