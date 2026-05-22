import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { vendorId, poNumber, lineItems } = await req.json()

    // Verify it exists and is in DRAFT status
    const existing = await prisma.purchaseOrder.findUnique({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 })
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "Only draft purchase orders can be edited" }, { status: 400 })
    }

    const amount = lineItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0)

    // Delete existing line items and recreate to handle additions/deletions easily
    const updated = await prisma.$transaction([
      prisma.purchaseOrderLine.deleteMany({
        where: { purchaseOrderId: params.id }
      }),
      prisma.purchaseOrder.update({
        where: { id: params.id },
        data: {
          vendorId,
          poNumber,
          amount,
          lineItems: {
            create: lineItems.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }))
          }
        },
        include: {
          lineItems: true,
          vendor: true
        }
      })
    ])

    return NextResponse.json(updated[1])
  } catch (error) {
    console.error("Failed to update purchase order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
