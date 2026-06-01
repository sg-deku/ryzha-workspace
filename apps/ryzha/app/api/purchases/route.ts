import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse, after } from "next/server"
import { createApprovalRequest } from "@/lib/approvals/approval-engine"
import { runApprovalAgent } from "@/lib/agents/p2p/approval"
import { getNextEntityNumber } from "@/lib/sequences"
import { writeAudit, getClientIp } from "@/lib/audit"

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const vendorId = searchParams.get("vendorId")

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(vendorId ? { vendorId } : {}),
    },
    select: { id: true, poNumber: true, status: true, totalAmount: true, approvalRequest: { select: { id: true, status: true, approverName: true, dueDate: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json(orders)
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { vendorId, poNumber: providedPoNumber, lineItems } = await req.json()

    if (!vendorId || !lineItems || lineItems.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
    const poNumber = providedPoNumber || await getNextEntityNumber(session.user.organizationId, "PO")

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        totalAmount,
        status: "DRAFT",
        organizationId: session.user.organizationId,
        lineItems: {
          create: lineItems.map((item: any) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            amount: Number(item.quantity) * Number(item.unitPrice),
          }))
        }
      },
      include: { vendor: true },
    })

    const settings = await prisma.p2PSettings.findUnique({
      where: { organizationId: session.user.organizationId }
    })

    const autoApproveLimit = settings?.autoApproveLimit ?? 500

    if (totalAmount <= autoApproveLimit) {
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: {
          status: "APPROVED",
          approvedBy: session.user.name ?? session.user.email ?? "System",
          approvedAt: new Date(),
        },
      })
    } else {
      const aiRouting = await runApprovalAgent(purchaseOrder.id, session.user.organizationId)

      const approverId = settings?.escalationApproverId ?? session.user.id
      const approverName = aiRouting.primaryApprover
      const description = `PO #${poNumber} — ${purchaseOrder.vendor.name} | AI routing: ${aiRouting.reasoning}${aiRouting.suggestedApprovers.length > 1 ? ` | Also: ${aiRouting.suggestedApprovers.slice(1).join(", ")}` : ""}`

      const approvalReq = await createApprovalRequest({
        organizationId: session.user.organizationId,
        entityType: "PurchaseOrder",
        entityId: purchaseOrder.id,
        approverId,
        approverName,
        requestedBy: session.user.name ?? session.user.email ?? session.user.id,
        amount: totalAmount,
        description,
      })

      await prisma.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: {
          status: "PENDING_APPROVAL",
          approvalRequestId: approvalReq.id,
        },
      })
    }

    after(
      writeAudit({
        action: "CREATE",
        entityType: "PurchaseOrder",
        entityId: purchaseOrder.id,
        actorId: session.user.id,
        actorEmail: session.user.email,
        organizationId: session.user.organizationId,
        after: { poNumber, vendorId, totalAmount, status: purchaseOrder.status },
        details: { poNumber, vendorName: purchaseOrder.vendor.name, lineCount: lineItems.length },
        ipAddress: getClientIp(req),
      }).catch(console.error)
    )

    return NextResponse.json(purchaseOrder)
  } catch (error) {
    console.error("Error creating purchase order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
