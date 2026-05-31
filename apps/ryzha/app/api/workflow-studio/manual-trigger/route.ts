import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse, after } from "next/server"
import { prisma } from "@/lib/prisma"
import { startAgentWorkflow, startP2PWorkflow, startO2CWorkflow } from "@/lib/agents/orchestrator"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { type, payload } = await req.json()
    const orgId = session.user.organizationId
    let executionId = ""

    const runningTransaction = await prisma.transaction.findFirst({
      where: { organizationId: orgId, workflowStatus: "running" },
      select: { id: true },
    })
    if (runningTransaction) {
      return NextResponse.json(
        { error: "A workflow is already running. Wait for it to complete before triggering another." },
        { status: 409 }
      )
    }

    if (type === "stripe") {
      const intentId = `sim_pi_${randomUUID().replace(/-/g, "").slice(0, 24)}`
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
      after(
        Promise.all([
          createSystemJournalEntry({
            organizationId: orgId,
            sourceType: "StripePayment",
            sourceId: intentId,
            reference: `SIM-${intentId.slice(-8)}`,
            description: `Simulated Stripe payment – ${customerEmail}`,
            entryDate: new Date(),
            lines: [
              { accountName: "Stripe Clearing Account", accountType: "Assets", debit: amount, credit: 0 },
              { accountName: "Subscription Revenue", accountType: "Revenue", debit: 0, credit: amount },
            ],
          }),
          startAgentWorkflow(executionId),
        ]).catch(console.error)
      )

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
      after(
        Promise.all([
          createSystemJournalEntry({
            organizationId: orgId,
            sourceType: "VendorInvoice",
            sourceId: invoice.id,
            reference: invoice.invoiceNumber,
            description: `Vendor invoice – ${vendor.name}`,
            entryDate: new Date(),
            lines: [
              { accountName: "Operating Expenses", accountType: "Expenses", debit: amount, credit: 0, description: `${invoice.invoiceNumber} – ${vendor.name}` },
              { accountName: "Accounts Payable", accountType: "Liabilities", debit: 0, credit: amount, description: `Amount owed to ${vendor.name}` },
            ],
          }),
          startP2PWorkflow(executionId),
        ]).catch(console.error)
      )

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
