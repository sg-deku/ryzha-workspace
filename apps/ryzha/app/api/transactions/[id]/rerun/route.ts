import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse, after } from "next/server"
import { prisma } from "@/lib/prisma"
import { startAgentWorkflow, startVendorPaymentWorkflow } from "@/lib/agents/orchestrator"

export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const transaction = await prisma.transaction.findUnique({
    where: { id, organizationId: session.user.organizationId },
  })

  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.transaction.update({
    where: { id },
    data: {
      workflowStatus: "pending",
      auditStatus: "pending",
      agentLogs: [],
    },
  })

  const isP2P = (transaction as any).transactionType === "VendorPayment"

  if (isP2P) {
    const vendorPaymentId = (transaction as any).vendorPaymentId
    if (!vendorPaymentId) return NextResponse.json({ error: "No vendor payment linked to this transaction" }, { status: 400 })
    after(startVendorPaymentWorkflow(vendorPaymentId, session.user.organizationId, id).catch(console.error))
  } else {
    after(startAgentWorkflow(id).catch(console.error))
  }

  return NextResponse.json({ success: true, transactionId: id })
}
