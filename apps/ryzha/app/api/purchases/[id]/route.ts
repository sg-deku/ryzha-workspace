import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { vendorId, poNumber, lineItems } = await req.json()

    const existing = await prisma.purchaseOrder.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 })
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json({ error: "Only draft purchase orders can be edited" }, { status: 400 })
    }

    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0)

    const updated = await prisma.$transaction([
      prisma.purchaseOrderLine.deleteMany({
        where: { purchaseOrderId: id }
      }),
      prisma.purchaseOrder.update({
        where: { id },
        data: {
          vendorId,
          poNumber,
          totalAmount,
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
