import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { runPreCloseChecklist } from "@/lib/accounting/period-engine"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const checklist = await runPreCloseChecklist(session.user.organizationId, params.id)
    return NextResponse.json(checklist)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
