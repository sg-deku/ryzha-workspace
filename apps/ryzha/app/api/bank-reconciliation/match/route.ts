import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { runAIReconciliationAgent } from "@/lib/agents/bank/ai-reconciliation"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId

  const matches = await runAIReconciliationAgent(orgId)

  const autoConfirmed: string[] = []

  for (const m of matches) {
    if (m.suggestedAction === "auto_confirm" && m.matchedId) {
      if (m.matchType === "vendor_payment") {
        await prisma.bankTransaction.update({
          where: { id: m.bankTransactionId },
          data: {
            matchStatus: "auto_matched",
            matchedVendorPaymentId: m.matchedId,
            reconciledAt: new Date(),
          },
        })
      } else if (m.matchType === "invoice_payment") {
        await prisma.bankTransaction.update({
          where: { id: m.bankTransactionId },
          data: {
            matchStatus: "auto_matched",
            matchedPaymentId: m.matchedId,
            reconciledAt: new Date(),
          },
        })
      }
      autoConfirmed.push(m.bankTransactionId)
    }
  }

  return NextResponse.json({
    total: matches.length,
    autoConfirmed: autoConfirmed.length,
    matches,
  })
}
