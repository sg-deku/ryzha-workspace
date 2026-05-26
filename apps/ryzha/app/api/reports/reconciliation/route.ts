import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkStripeReconciliation } from "@/lib/reports/general-ledger/bank-reconciliation"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgId = session.user.organizationId
  const result = await checkStripeReconciliation(orgId)

  return NextResponse.json(result)
}
