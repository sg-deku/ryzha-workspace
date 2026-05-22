import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
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
      const customerEmail = payload?.customerEmail || "simulated@example.com"
      const description = payload?.description || "Manual Stripe Simulation"

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
      startAgentWorkflow(executionId).catch(console.error)

    } else if (type === "p2p") {
      const amount = Number(payload?.amount) || 500
      const vendorName = payload?.vendorName || `Mock Vendor ${Date.now()}`
      const hasPO = payload?.hasPO !== false
      const scenario = payload?.scenario || "standard"

      const vendor = await prisma.vendor.create({
        data: { name: vendorName, email: `vendor-${Date.now()}@example.com`, organizationId: orgId },
      })

      let po = null
      if (hasPO) {
        po = await prisma.purchaseOrder.create({
          data: {
            poNumber: `PO-${Date.now()}`,
            vendorId: vendor.id,
            totalAmount: amount,
            organizationId: orgId,
          },
        })
      }

      const invoice = await prisma.vendorInvoice.create({
        data: {
          invoiceNumber: `INV-${Date.now()}`,
          vendorId: vendor.id,
          purchaseOrderId: po?.id ?? null,
          amount,
          dueDate: scenario === "overdue"
            ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          organizationId: orgId,
        },
      })
      executionId = invoice.id
      startP2PWorkflow(executionId).catch(console.error)

    } else if (type === "o2c") {
      const amount = Number(payload?.amount) || 1500
      const customerName = payload?.customerName || `Mock Customer ${Date.now()}`
      const customerEmail = payload?.customerEmail || "mock@customer.com"
      const scenario = payload?.scenario || "new_customer"

      const orderStatus = scenario === "churn_risk" ? "INVOICED" : "PAID"

      const customer = await prisma.customer.create({
        data: { name: customerName, email: customerEmail, organizationId: orgId },
      })

      const so = await prisma.salesOrder.create({
        data: {
          orderNumber: `SO-${Date.now()}`,
          customerId: customer.id,
          totalAmount: amount,
          organizationId: orgId,
          status: orderStatus,
        },
      })
      executionId = so.id
      startO2CWorkflow(executionId, scenario).catch(console.error)
    }

    return NextResponse.json({ executionId })
  } catch (error: any) {
    console.error("Workflow trigger error:", error)
    return NextResponse.json({ error: error.message || "Failed to trigger workflow" }, { status: 500 })
  }
}
