import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { runDisputeAgent } from "@/lib/agents/o2c/dispute"
import { createNotification } from "@/lib/notifications"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const orgId = session.user.organizationId

  const { reason } = await req.json()
  if (!reason) return NextResponse.json({ error: "Reason is required" }, { status: 400 })

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId: orgId }
  })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

  const result = await runDisputeAgent(id, reason, orgId)

  await createNotification({
    organizationId: orgId,
    type: "WARNING",
    title: "Invoice Disputed",
    message: `Dispute on invoice #${invoice.invoiceNumber}. Suggested action: ${result.suggestedAction}`,
    link: `/invoices/${invoice.id}`
  })

  // Optionally change status or log it somewhere
  // For now, returning the AI suggestions
  return NextResponse.json({ success: true, result })
}
