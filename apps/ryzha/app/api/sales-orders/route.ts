import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse, after } from "next/server"
import { startO2CWorkflow } from "@/lib/agents/orchestrator"
import { getNextEntityNumber } from "@/lib/sequences"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { customerId, orderNumber: providedOrderNumber, lineItems } = await req.json()

    if (!customerId || !lineItems || lineItems.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
    const orderNumber = providedOrderNumber || await getNextEntityNumber(session.user.organizationId, "SO")

    const salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId,
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

    // Trigger the O2C workflow in the background
    after(startO2CWorkflow(salesOrder.id).catch(console.error))

    return NextResponse.json(salesOrder)
  } catch (error) {
    console.error("Error creating sales order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
