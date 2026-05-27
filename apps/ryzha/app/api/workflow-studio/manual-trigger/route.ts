import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse, after } from "next/server"
import { prisma } from "@/lib/prisma"
import { startAgentWorkflow, startP2PWorkflow, startO2CWorkflow } from "@/lib/agents/orchestrator"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { type, payload } = await req.json()
    const orgId = session.user.organizationId
    let executionId = ""

    if (type === "stripe") {
      const intentId = `sim_tx_${Date.now()}`
      const amount = Number(payload?.amount) || 1000
      const description = payload?.description || "Manual Stripe Simulation"

      let customerEmail = payload?.customerEmail || "simulated@example.com"

      if (payload?.customerId) {
        const customer = await prisma.customer.findFirst({
          where: { id: payload.customerId, organizationId: orgId },
          select: { email: true },
        })
        if (customer?.email) customerEmail = customer.email
      }

      await prisma.contract.create({
        data: {
          stripePaymentIntentId: intentId,
          customerEmail,
          amount,
          status: "signed",
          organizationId: orgId,
        },
      })

      const transaction = await prisma.transaction.create({
        data: {
          stripePaymentIntentId: intentId,
          amount,
          description,
          customerEmail,
          organizationId: orgId,
          agentLogs: [],
        },
      })
      executionId = transaction.id
      after(startAgentWorkflow(executionId).catch(console.error))

    } else if (type === "p2p") {
      const amount = Number(payload?.amount) || 500
      const hasPO = payload?.hasPO !== false
      const vendorId = payload?.vendorId

      if (!vendorId) {
        return NextResponse.json({ error: "vendorId is required" }, { status: 400 })
      }

      const vendor = await prisma.vendor.findFirst({
        where: { id: vendorId, organizationId: orgId },
      })
      if (!vendor) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
      }

      let po = null
      if (hasPO) {
        po = await prisma.purchaseOrder.create({
          data: {
            poNumber: `PO-SIM-${Date.now()}`,
            vendorId: vendor.id,
            totalAmount: amount,
            organizationId: orgId,
          },
        })
      }

      const invoice = await prisma.vendorInvoice.create({
        data: {
          invoiceNumber: `INV-SIM-${Date.now()}`,
          vendorId: vendor.id,
          purchaseOrderId: po?.id ?? null,
          amount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          organizationId: orgId,
        },
      })
      executionId = invoice.id
      after(startP2PWorkflow(executionId).catch(console.error))

    } else if (type === "o2c") {
      const amount = Number(payload?.amount) || 1500
      const customerId = payload?.customerId

      if (!customerId) {
        return NextResponse.json({ error: "customerId is required" }, { status: 400 })
      }

      const customer = await prisma.customer.findFirst({
        where: { id: customerId, organizationId: orgId },
      })
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
      }

      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-SIM-${Date.now()}`,
          customerId: customer.id,
          totalAmount: amount,
          organizationId: orgId,
          status: "APPROVED",
        },
      })
      executionId = so.id
      after(startO2CWorkflow(executionId).catch(console.error))
    }

    return NextResponse.json({ executionId })
  } catch (error: any) {
    console.error("Workflow trigger error:", error)
    return NextResponse.json({ error: error.message || "Failed to trigger workflow" }, { status: 500 })
  }
}
