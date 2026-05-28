import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { runApprovalAgent } from "@/lib/agents/p2p/approval"
import { createNotification } from "@/lib/notifications"

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
    select: { id: true, poNumber: true, status: true, totalAmount: true },
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

    const { vendorId, poNumber, lineItems } = await req.json()

    if (!vendorId || !poNumber || !lineItems || lineItems.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)

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
    })

    const settings = await prisma.p2PSettings.findUnique({
      where: { organizationId: session.user.organizationId }
    })

    const autoApproveLimit = settings?.autoApproveLimit ?? 500

    if (totalAmount > autoApproveLimit) {
      const approval = await runApprovalAgent(purchaseOrder.id, session.user.organizationId)
      
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: { status: "ROUTED" }
      })

      const approvers = approval.suggestedApprovers.join(", ")

      await createNotification({
        organizationId: session.user.organizationId,
        type: "WARNING",
        title: "PO Requires Approval",
        message: `PO #${poNumber} requires approval by: ${approvers}.`,
        link: `/purchases/${purchaseOrder.id}`
      })
    } else {
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: { status: "APPROVED" }
      })
    }

    return NextResponse.json(purchaseOrder)
  } catch (error) {
    console.error("Error creating purchase order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
