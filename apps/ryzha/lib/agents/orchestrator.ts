import { prisma } from "@/lib/prisma"
import { runR2RAgent } from "./r2r"
import { runOMAgent } from "./om"
import { runAuditorAgent } from "./auditor"
import { runFPAgent } from "./fpna"
import { runMatchingAgent } from "./p2p/matching"
import { runCollectionsAgent } from "./o2c/collections"
import { sendVoiceSummary, sendSMSNotification, createNotification } from "@/lib/notifications"
import { publishEvent } from "@/lib/events"

export async function startAgentWorkflow(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } })
  if (!transaction) return

  const orgId = transaction.organizationId

  try {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { workflowStatus: "running" }
    })

    // Helper to log and publish
    const logAndPublish = async (agent: string, message: string) => {
      const logEntry = {
        agent,
        message,
        timestamp: new Date().toISOString()
      }
      
      const currentTx = await prisma.transaction.findUnique({ where: { id: transactionId } })
      let currentLogs: any[] = []
      
      if (currentTx && currentTx.agentLogs) {
        if (Array.isArray(currentTx.agentLogs)) {
          currentLogs = currentTx.agentLogs
        } else if (typeof currentTx.agentLogs === "string") {
          try { currentLogs = JSON.parse(currentTx.agentLogs) } catch(e) {}
        }
      }
      
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          agentLogs: [...currentLogs, logEntry]
        }
      })

      await publishEvent(`org:${orgId}:events`, {
        type: "agent_log",
        transactionId,
        ...logEntry
      })
    }

    await logAndPublish("Orchestrator", `Workflow started | Transaction ID: ${transactionId} | Payment Intent: ${transaction.stripePaymentIntentId} | Customer: ${transaction.customerEmail ?? "unknown"} | Amount: $${transaction.amount}`)

    // Step 1: R2R
    await logAndPublish("Orchestrator", `[1/4] Starting R2R Agent — recording revenue of $${transaction.amount}...`)
    let r2rResult
    try {
      r2rResult = await runR2RAgent(transactionId)
      if (!r2rResult) throw new Error("returned null")
    } catch (err: any) {
      await logAndPublish("R2R", `FAILED — ${err.message}`)
      throw new Error(`R2R Agent failed: ${err.message}`)
    }
    await logAndPublish("R2R", `Revenue of $${transaction.amount} recorded. Recognition type: ${r2rResult.revenueRecognitionType ?? "immediate"}.`)

    // Step 2: O&M
    await logAndPublish("Orchestrator", `[2/4] Starting O&M Agent — applying ASC 606 revenue recognition policy...`)
    let afterOM
    try {
      afterOM = await runOMAgent(transactionId)
      if (!afterOM) throw new Error("returned null")
    } catch (err: any) {
      await logAndPublish("O&M", `FAILED — ${err.message}`)
      throw new Error(`O&M Agent failed: ${err.message}`)
    }
    const recognized = (afterOM as any).recognizedRevenue ?? transaction.amount
    const deferred = (afterOM as any).deferredRevenue ?? 0
    await logAndPublish("O&M", `Policy applied. Recognized: $${recognized}${deferred > 0 ? ` | Deferred: $${deferred} over contract period` : " (immediate)"}.`)

    // Step 3: Auditor
    await logAndPublish("Orchestrator", `[3/4] Starting Auditor Agent — verifying contract for Payment Intent ${transaction.stripePaymentIntentId}...`)
    let afterAuditor
    try {
      afterAuditor = await runAuditorAgent(transactionId)
    } catch (err: any) {
      await logAndPublish("Auditor", `FAILED — unexpected error: ${err.message}`)
      await prisma.transaction.update({ where: { id: transactionId }, data: { workflowStatus: "error" } })
      return
    }

    if (!afterAuditor || afterAuditor.auditStatus !== "verified") {
      const status = afterAuditor?.auditStatus ?? "unknown"
      await logAndPublish("Auditor", `FAILED — audit status: ${status}. No signed contract found matching Payment Intent ${transaction.stripePaymentIntentId}. Create a contract record under Contracts and re-run.`)
      await prisma.transaction.update({ where: { id: transactionId }, data: { workflowStatus: "error" } })
      return
    }
    await logAndPublish("Auditor", `Verified. Audit hash: ${afterAuditor.auditHash ?? "n/a"}. Contract matched for ${transaction.customerEmail}.`)

    // Step 4: FP&A
    await logAndPublish("Orchestrator", `[4/4] Starting FP&A Agent — recalculating runway and financial model...`)
    let fpResult
    try {
      fpResult = await runFPAgent(transactionId)
      if (!fpResult) throw new Error("returned null")
    } catch (err: any) {
      await logAndPublish("FP&A", `FAILED — ${err.message}`)
      throw new Error(`FP&A Agent failed: ${err.message}`)
    }
    const runway = (fpResult as any).runwayMonths
    const zeroCash = (fpResult as any).zeroCashDate
    await logAndPublish("FP&A", `Financial model updated. Runway: ${runway ?? "—"} months | Zero cash date: ${zeroCash ?? "—"}.`)

    // Final
    await logAndPublish("Orchestrator", `All agents completed. Sending notifications...`)
    await sendVoiceSummary(transactionId)
    await sendSMSNotification(transactionId)

    await createNotification({
      organizationId: orgId,
      type: "SUCCESS",
      title: "Transaction Reconciled",
      message: `Transaction for $${transaction.amount} from ${transaction.customerEmail ?? "unknown"} was successfully reconciled.`,
      link: `/transactions/${transactionId}`
    })

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { workflowStatus: "completed" },
    })

    await logAndPublish("Orchestrator", `Workflow COMPLETED | Transaction ID: ${transactionId} | $${transaction.amount} from ${transaction.customerEmail ?? "unknown"} fully processed.`)

    await publishEvent(`org:${orgId}:events`, {
      type: "workflow_completed",
      transactionId,
      timestamp: new Date(),
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    console.error("Workflow error:", error)
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { workflowStatus: "error" },
    })
    await publishEvent(`org:${orgId}:events`, {
      type: "workflow_error",
      transactionId,
      error: errMsg,
      timestamp: new Date(),
    })
    await createNotification({
      organizationId: orgId,
      type: "ERROR",
      title: "Reconciliation Failed",
      message: `Transaction ${transactionId} failed reconciliation.`,
      link: `/transactions/${transactionId}`
    })
  }
}

export async function startP2PWorkflow(vendorInvoiceId: string) {
  const invoice = await prisma.vendorInvoice.findUnique({
    where: { id: vendorInvoiceId },
    include: { organization: true, vendor: true, purchaseOrder: true }
  })
  if (!invoice) return

  const orgId = invoice.organizationId

  const appendP2PLog = async (agent: string, message: string) => {
    const logEntry = { agent, message, timestamp: new Date().toISOString() }
    const current = await prisma.vendorInvoice.findUnique({ where: { id: vendorInvoiceId }, select: { agentLogs: true } })
    const existing = Array.isArray(current?.agentLogs) ? (current.agentLogs as any[]) : []
    await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { agentLogs: [...existing, logEntry] } })
    await publishEvent(`org:${orgId}:events`, { type: "agent_log", transactionId: vendorInvoiceId, ...logEntry })
  }

  try {
    await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { workflowStatus: "running", agentLogs: [] } })

    await appendP2PLog("Orchestrator", `P2P Workflow started | Invoice ID: ${vendorInvoiceId} | Invoice #: ${invoice.invoiceNumber} | Vendor: ${invoice.vendor?.name ?? "unknown"} | Amount: $${invoice.amount} | PO: ${invoice.purchaseOrder?.poNumber ?? "none"} | Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "n/a"}`)
    await appendP2PLog("Orchestrator", `[1/2] Starting Matching Agent — comparing invoice against PO...`)

    let matchingResult
    try {
      matchingResult = await runMatchingAgent(vendorInvoiceId)
    } catch (err: any) {
      await appendP2PLog("Matching", `FAILED — ${err.message}`)
      await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { workflowStatus: "error" } })
      throw err
    }

    const updated = matchingResult?.updated || invoice
    const matchLog = matchingResult?.logMessage || "Matching result unknown"
    await appendP2PLog("Matching", `${matchLog} | Final status: ${updated.status}`)
    await appendP2PLog("Orchestrator", `[2/2] Processing matched invoice — creating expense record...`)

    if (updated.status === "MATCHED") {
      const expense = await prisma.expense.create({
        data: {
          date: new Date(),
          description: `Vendor Invoice: ${updated.invoiceNumber}`,
          amount: updated.amount,
          category: "Accounts Payable",
          organizationId: orgId,
          status: "REVIEWED",
        },
      })
      await appendP2PLog("Orchestrator", `Expense record created | Expense ID: ${expense.id} | Amount: $${expense.amount} | Category: ${expense.category}`)
      await appendP2PLog("Orchestrator", `P2P Workflow COMPLETED | Invoice #${updated.invoiceNumber} from ${invoice.vendor?.name ?? "vendor"} approved and expensed.`)
      await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { workflowStatus: "completed" } })
      
      await createNotification({
        organizationId: orgId,
        type: "SUCCESS",
        title: "Invoice Matched & Expensed",
        message: `Invoice #${updated.invoiceNumber} for $${updated.amount} was matched and expensed.`,
        link: `/vendor-invoices/${vendorInvoiceId}`
      })
    } else {
      await appendP2PLog("Orchestrator", `P2P Workflow STOPPED | Invoice #${updated.invoiceNumber} status is "${updated.status}". Manual review required before expense is created.`)
      await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { workflowStatus: "error" } })

      await createNotification({
        organizationId: orgId,
        type: "WARNING",
        title: "Invoice Disputed",
        message: `Invoice #${updated.invoiceNumber} requires manual review. Status: ${updated.status}.`,
        link: `/vendor-invoices/${vendorInvoiceId}`
      })
    }

    await publishEvent(`org:${orgId}:events`, {
      type: "p2p_workflow_log",
      vendorInvoiceId,
      message: matchLog,
      status: updated.status,
      timestamp: new Date(),
    })
  } catch (error: any) {
    console.error("P2P Workflow error:", error)
    await appendP2PLog("Orchestrator", `P2P Workflow ERROR | Invoice ID: ${vendorInvoiceId} | ${error.message}`)
    await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { workflowStatus: "error" } }).catch(() => {})
    
    await createNotification({
      organizationId: orgId,
      type: "ERROR",
      title: "P2P Workflow Failed",
      message: `Error processing vendor invoice.`,
      link: `/vendor-invoices/${vendorInvoiceId}`
    }).catch(() => {})
  }
}

export async function startO2CWorkflow(salesOrderId: string, scenario?: string) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { organization: true, customer: true }
  })
  if (!order) return

  const orgId = order.organizationId

  const appendO2CLog = async (agent: string, message: string) => {
    const logEntry = { agent, message, timestamp: new Date().toISOString() }
    const current = await prisma.salesOrder.findUnique({ where: { id: salesOrderId }, select: { agentLogs: true } })
    const existing = Array.isArray(current?.agentLogs) ? (current.agentLogs as any[]) : []
    await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { agentLogs: [...existing, logEntry] } })
    await publishEvent(`org:${orgId}:events`, { type: "agent_log", transactionId: salesOrderId, ...logEntry })
  }

  try {
    await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "running", agentLogs: [] } })

    await appendO2CLog("Orchestrator", `O2C Workflow started | Sales Order ID: ${salesOrderId} | Order #: ${order.orderNumber} | Customer: ${order.customer.name} (${order.customer.email ?? "no email"}) | Amount: $${order.totalAmount} | Status: ${order.status}`)

    if (order.status === "PAID") {
      await appendO2CLog("Orchestrator", `[1/2] Order is PAID — creating synthetic contract + transaction for agent pipeline...`)

      const intentId = `o2c-${order.orderNumber}-${Date.now()}`

      const contract = await prisma.contract.create({
        data: {
          stripePaymentIntentId: intentId,
          customerEmail: order.customer.email || "customer@example.com",
          amount: order.totalAmount,
          status: "signed",
          organizationId: orgId,
        },
      })
      await appendO2CLog("Orchestrator", `Contract auto-created | Contract ID: ${contract.id} | Customer: ${order.customer.email} | Intent: ${intentId}`)

      const transaction = await prisma.transaction.create({
        data: {
          stripePaymentIntentId: intentId,
          amount: order.totalAmount,
          description: `Sales Order Payment: ${order.orderNumber} — ${order.customer.name}`,
          customerEmail: order.customer.email,
          organizationId: orgId,
          agentLogs: [],
        },
      })
      await appendO2CLog("Orchestrator", `[2/2] Transaction created | Transaction ID: ${transaction.id} | Handing off to R2R → O&M → Auditor → FP&A pipeline...`)
      await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "completed" } })

      await startAgentWorkflow(transaction.id)
    } else if (order.status === "INVOICED") {
      await appendO2CLog("Collections", `[1/1] Order is INVOICED but unpaid — running collections check...`)
      const daysSinceCreated = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      await appendO2CLog("Collections", `Customer: ${order.customer.name} (${order.customer.email ?? "no email"}) | Amount: $${order.totalAmount} | Days since invoiced: ${daysSinceCreated} | Action: Flag for dunning outreach`)
      await appendO2CLog("Collections", `Dunning recommended — ${order.customer.name} has an open invoice of $${order.totalAmount} (Order #${order.orderNumber}) with no payment received. Schedule follow-up contact.`)
      await appendO2CLog("Orchestrator", `O2C Collections flow COMPLETED | Order #${order.orderNumber} flagged. No financial pipeline triggered until payment is received.`)
      await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "completed" } })

      await createNotification({
        organizationId: orgId,
        type: "WARNING",
        title: "Collections Risk",
        message: `Order #${order.orderNumber} from ${order.customer.name} was flagged for dunning outreach.`,
        link: `/sales-orders/${salesOrderId}`
      })
    } else {
      await appendO2CLog("Orchestrator", `O2C Workflow SKIPPED | Order #${order.orderNumber} is in status "${order.status}" — expected PAID or INVOICED. No action taken.`)
      await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "error" } })
    }

    await publishEvent(`org:${orgId}:events`, {
      type: "o2c_workflow_log",
      salesOrderId,
      message: `O2C: Processed order ${order.orderNumber}. Status: ${order.status}`,
      timestamp: new Date(),
    })
  } catch (error: any) {
    console.error("O2C Workflow error:", error)
    await appendO2CLog("Orchestrator", `O2C Workflow ERROR | Order ID: ${salesOrderId} | Order #: ${order.orderNumber} | ${error.message}`)
    await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "error" } }).catch(() => {})
    
    await createNotification({
      organizationId: orgId,
      type: "ERROR",
      title: "O2C Workflow Failed",
      message: `Error processing sales order #${order.orderNumber}.`,
      link: `/sales-orders/${salesOrderId}`
    }).catch(() => {})
  }
}
