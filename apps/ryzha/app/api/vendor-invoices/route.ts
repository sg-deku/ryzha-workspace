import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { vendorId, purchaseOrderId, invoiceNumber, lineItems } = await req.json()

    if (!vendorId || !invoiceNumber || !lineItems || lineItems.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)

    const vendorInvoice = await prisma.vendorInvoice.create({
      data: {
        invoiceNumber,
        vendorId,
        purchaseOrderId: purchaseOrderId || null,
        status: "RECEIVED",
        amount: totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to NET30
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

    return NextResponse.json(vendorInvoice)
  } catch (error) {
    console.error("Error creating vendor invoice:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
