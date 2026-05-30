import { prisma } from "@/lib/prisma"
import { after } from "next/server"
import { runR2RAgent } from "./r2r"
import { runOMAgent } from "./om"
import { runAuditorAgent } from "./auditor"
import { runFPAgent } from "./fpna"
import { runMatchingAgent } from "./p2p/matching"
import { runGLCodingAgent } from "./p2p/gl-coding"
import { runCollectionsAgent } from "./o2c/collections"
import { runCashApplicationAgent } from "./o2c/cash-application"
import { runCreditNoteAgent } from "./o2c/credit-note"
import { runInvoiceGenerationAgent } from "./o2c/invoice-generation"
import { runPaymentSchedulerAgent } from "./p2p/payment-scheduler"
import { sendVoiceSummary, sendSMSNotification, createNotification } from "@/lib/notifications"
import { publishEvent } from "@/lib/events"
import { detectAnomalies } from "@/lib/ai/anomaly-detector"

export async function startAgentWorkflow(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } })
  if (!transaction) return

  const orgId = transaction.organizationId
  const logs: any[] = []

  let currentLogs: any[] = []
  if (transaction.agentLogs) {
    if (Array.isArray(transaction.agentLogs)) {
      currentLogs = transaction.agentLogs
    } else if (typeof transaction.agentLogs === "string") {
      try { currentLogs = JSON.parse(transaction.agentLogs) } catch(e) {}
    }
  }

  const logAndPublish = async (agent: string, message: string) => {
    const logEntry = {
      agent,
      message,
      timestamp: new Date().toISOString()
    }
    
    logs.push(logEntry)

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { agentLogs: [...currentLogs, ...logs] },
    })

    await publishEvent(`org:${orgId}:events`, {
      type: "agent_log",
      transactionId,
      ...logEntry
    })
  }

  try {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { workflowStatus: "running" }
    })

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
      await logAndPublish("Orchestrator", `Workflow ERROR | Auditor failed.`)
      await prisma.transaction.update({ where: { id: transactionId }, data: { workflowStatus: "error", agentLogs: [...currentLogs, ...logs] } })
      return
    }

    if (!afterAuditor || afterAuditor.auditStatus === "rejected" || afterAuditor.auditStatus === "flagged") {
      const status = afterAuditor?.auditStatus ?? "unknown"
      const isFlagged = status === "flagged"
      await logAndPublish("Auditor", isFlagged
        ? `FLAGGED — anomaly detected or no verified contract. Revenue posted to suspense (Revenue Suspense CR / AR – Disputed DR). Manual review required before revenue can be recognized.`
        : `FAILED — audit status: ${status}. No signed contract found matching Payment Intent ${transaction.stripePaymentIntentId}. Create a contract record under Contracts and re-run.`
      )
      await logAndPublish("Orchestrator", `Workflow STOPPED | Auditor ${isFlagged ? "flagged" : "rejected"} transaction. FP&A pipeline not run — revenue is not recognized until audit is cleared.`)
      await createNotification({
        organizationId: orgId,
        type: isFlagged ? "WARNING" : "ERROR",
        title: isFlagged ? "Transaction Flagged for Audit Review" : "Audit Verification Failed",
        message: isFlagged
          ? `$${transaction.amount} from ${transaction.customerEmail ?? "unknown"} flagged by Auditor. Revenue held in suspense pending clearance.`
          : `No signed contract for Payment Intent ${transaction.stripePaymentIntentId}. Create a contract and re-run.`,
        link: `/transactions/${transactionId}`
      })
      await prisma.transaction.update({ where: { id: transactionId }, data: { workflowStatus: "error", agentLogs: [...currentLogs, ...logs] } })
      return
    }
    await logAndPublish("Auditor", `Verified. Audit status: ${afterAuditor.auditStatus}. Audit hash: ${afterAuditor.auditHash ?? "n/a"}. Contract matched for ${transaction.customerEmail}.`)

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

    await logAndPublish("Orchestrator", `Workflow COMPLETED | Transaction ID: ${transactionId} | $${transaction.amount} from ${transaction.customerEmail ?? "unknown"} fully processed.`)

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { workflowStatus: "completed", agentLogs: [...currentLogs, ...logs] },
    })

    await publishEvent(`org:${orgId}:events`, {
      type: "workflow_completed",
      transactionId,
      timestamp: new Date(),
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error"
    console.error("Workflow error:", error)
    await logAndPublish("Orchestrator", `Workflow ERROR | ${errMsg}`)
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { workflowStatus: "error", agentLogs: [...currentLogs, ...logs] },
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
  const logs: any[] = []

  let currentLogs: any[] = []
  if (invoice.agentLogs) {
    if (Array.isArray(invoice.agentLogs)) {
      currentLogs = invoice.agentLogs
    } else if (typeof invoice.agentLogs === "string") {
      try { currentLogs = JSON.parse(invoice.agentLogs) } catch(e) {}
    }
  }

  const appendP2PLog = async (agent: string, message: string) => {
    const logEntry = { agent, message, timestamp: new Date().toISOString() }
    logs.push(logEntry)
    await prisma.vendorInvoice.update({
      where: { id: vendorInvoiceId },
      data: { agentLogs: [...currentLogs, ...logs] },
    })
    await publishEvent(`org:${orgId}:events`, { type: "agent_log", transactionId: vendorInvoiceId, ...logEntry })
  }

  try {
    await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { workflowStatus: "running" } })

    await appendP2PLog("Orchestrator", `P2P Workflow started | Invoice ID: ${vendorInvoiceId} | Invoice #: ${invoice.invoiceNumber} | Vendor: ${invoice.vendor?.name ?? "unknown"} | Amount: $${invoice.amount} | PO: ${invoice.purchaseOrder?.poNumber ?? "none"} | Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "n/a"}`)
    await appendP2PLog("Orchestrator", `[1/2] Starting Matching Agent — comparing invoice against PO...`)

    let matchingResult
    try {
      matchingResult = await runMatchingAgent(vendorInvoiceId)
    } catch (err: any) {
      await appendP2PLog("Matching", `FAILED — ${err.message}`)
      await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { workflowStatus: "error", agentLogs: [...currentLogs, ...logs] } })
      throw err
    }

    const updated = matchingResult?.updated || invoice
    const matchLog = matchingResult?.logMessage || "Matching result unknown"
    await appendP2PLog("Matching", `${matchLog} | Final status: ${updated.status}`)
    await appendP2PLog("Orchestrator", `[2/2] Processing matched invoice — creating expense record...`)

    if (updated.status === "MATCHED") {
      let category = "Software & SaaS" // fallback
      try {
        await appendP2PLog("GL Coding", `[2a/2] Starting GL Coding Agent to determine expense account...`)
        const glResult = await runGLCodingAgent(
          `Vendor Invoice: ${updated.invoiceNumber} from ${invoice.vendor?.name ?? "unknown"}`,
          orgId
        )
        category = glResult.suggestedCategory || category
        await appendP2PLog("GL Coding", `AI suggests category: ${category}`)
      } catch (err: any) {
        await appendP2PLog("GL Coding", `AI fallback — using default. Error: ${err.message}`)
      }

      const expense = await prisma.expense.create({
        data: {
          date: new Date(),
          description: `Vendor Invoice: ${updated.invoiceNumber}`,
          amount: updated.amount,
          category,
          organizationId: orgId,
          status: "REVIEWED",
        },
      })

      await detectAnomalies(expense.id, orgId)

      await appendP2PLog("Orchestrator", `Expense record created | Expense ID: ${expense.id} | Amount: $${expense.amount} | Category: ${expense.category}`)
      await appendP2PLog("Orchestrator", `P2P Workflow COMPLETED | Invoice #${updated.invoiceNumber} from ${invoice.vendor?.name ?? "vendor"} approved and expensed.`)
      await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { workflowStatus: "completed", agentLogs: [...currentLogs, ...logs] } })
      
      await createNotification({
        organizationId: orgId,
        type: "SUCCESS",
        title: "Invoice Matched & Expensed",
        message: `Invoice #${updated.invoiceNumber} for $${updated.amount} was matched and expensed.`,
        link: `/vendor-invoices/${vendorInvoiceId}`
      })
    } else {
      await appendP2PLog("Orchestrator", `P2P Workflow ERROR | STOPPED | Invoice #${updated.invoiceNumber} status is "${updated.status}". Manual review required before expense is created.`)
      await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { workflowStatus: "error", agentLogs: [...currentLogs, ...logs] } })

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
    await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { workflowStatus: "error", agentLogs: [...currentLogs, ...logs] } }).catch(() => {})
    
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
  const logs: any[] = []

  let currentLogs: any[] = []
  if (order.agentLogs) {
    if (Array.isArray(order.agentLogs)) {
      currentLogs = order.agentLogs
    } else if (typeof order.agentLogs === "string") {
      try { currentLogs = JSON.parse(order.agentLogs) } catch(e) {}
    }
  }

  const appendO2CLog = async (agent: string, message: string) => {
    const logEntry = { agent, message, timestamp: new Date().toISOString() }
    logs.push(logEntry)
    await prisma.salesOrder.update({
      where: { id: salesOrderId },
      data: { agentLogs: [...currentLogs, ...logs] },
    })
    await publishEvent(`org:${orgId}:events`, { type: "agent_log", transactionId: salesOrderId, ...logEntry })
  }

  try {
    await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "running" } })

    await appendO2CLog("Orchestrator", `O2C Workflow started | Sales Order ID: ${salesOrderId} | Order #: ${order.orderNumber} | Customer: ${order.customer.name} (${order.customer.email ?? "no email"}) | Amount: $${order.totalAmount} | Status: ${order.status}`)

    if (order.status === "DRAFT") {
      await appendO2CLog("Orchestrator", `[1/2] Order is DRAFT — triggering Order Intake Agent for validation...`)
      try {
        const { runCustomerValidationAgent } = await import("./o2c/customer-validation")
        const valResult = await runCustomerValidationAgent(order.customer, order.totalAmount, orgId)
        await appendO2CLog("OrderIntake", `Validation complete. Risk Score: ${valResult.riskScore}. Reasoning: ${valResult.aiReasoning.substring(0, 100)}...`)
        
        if (valResult.status === "REJECTED" || valResult.status === "FLAGGED") {
          await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { status: "REJECTED", workflowStatus: "error", agentLogs: [...currentLogs, ...logs] } })
          await appendO2CLog("Orchestrator", `[2/2] Order status updated to REJECTED due to credit limit violation. Stopping workflow.`)
          await createNotification({
            organizationId: orgId,
            type: "ERROR",
            title: "Sales Order Rejected",
            message: `Order #${order.orderNumber} exceeded customer credit limit.`,
            link: `/sales-orders/${salesOrderId}`
          })
          return // Stop execution
        } else {
          await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { status: "APPROVED" } })
          order.status = "APPROVED"
          await appendO2CLog("Orchestrator", `[2/2] Order status updated to APPROVED. Proceeding to Invoice Generation...`)
        }
      } catch (err: any) {
        await appendO2CLog("OrderIntake", `FAILED validation — ${err.message}`)
        throw err
      }
    }

    if (order.status === "APPROVED") {
      await appendO2CLog("Orchestrator", `[1/1] Order is APPROVED — triggering Invoice Generation Agent...`)
      try {
        const invResult = await runInvoiceGenerationAgent(salesOrderId, orgId)
        await appendO2CLog("InvoiceGen", invResult.message)
      } catch (err: any) {
        await appendO2CLog("InvoiceGen", `FAILED — ${err.message}`)
        throw err
      }
      await appendO2CLog("Orchestrator", `O2C Workflow COMPLETED | Invoice Generated.`)
      await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "completed", agentLogs: [...currentLogs, ...logs] } })
      
      await createNotification({
        organizationId: orgId,
        type: "SUCCESS",
        title: "Invoice Generated",
        message: `Invoice generated for Order #${order.orderNumber}.`,
        link: `/sales-orders/${salesOrderId}`
      })
    } else if (order.status === "PAID") {
      const invoiceId = (order as any).invoiceId;
      if (invoiceId) {
        const existingTx = await prisma.transaction.findFirst({
          where: { organizationId: orgId, invoiceId: invoiceId }
        })
        if (existingTx) {
          await appendO2CLog("Orchestrator", `Transaction already exists (${existingTx.id}). Skipping pipeline.`)
          await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "completed", agentLogs: [...currentLogs, ...logs] } })
          return
        }
      }

      await appendO2CLog("Orchestrator", `[1/2] Order is PAID — creating transaction for agent pipeline...`)

      const intentId = `o2c-${order.orderNumber}-${Date.now()}`

      const transaction = await prisma.transaction.create({
        data: {
          stripePaymentIntentId: intentId,
          amount: order.totalAmount,
          description: `Sales Order Payment: ${order.orderNumber} — ${order.customer.name}`,
          customerEmail: order.customer.email,
          organizationId: orgId,
          agentLogs: [],
          invoiceId: invoiceId || null,
        },
      })
      await appendO2CLog("Orchestrator", `[2/2] Transaction created | Transaction ID: ${transaction.id} | Handing off to R2R → O&M → Auditor → FP&A pipeline...`)
      await appendO2CLog("Orchestrator", `O2C Workflow COMPLETED | Handed off to financial pipeline.`)
      await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "completed", agentLogs: [...currentLogs, ...logs] } })

      after(startAgentWorkflow(transaction.id).catch(console.error))
    } else if (order.status === "INVOICED") {
      await appendO2CLog("Collections", `[1/1] Order is INVOICED but unpaid — running collections check...`)
      
      try {
        const collectionsResults = await runCollectionsAgent(orgId)
        await appendO2CLog("Collections", `Dunning logic triggered — actions performed: ${JSON.stringify(collectionsResults.slice(0, 2))}...`)
      } catch (err: any) {
        await appendO2CLog("Collections", `Collections check failed: ${err.message}`)
      }
      
      const daysSinceCreated = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      await appendO2CLog("Collections", `Customer: ${order.customer.name} (${order.customer.email ?? "no email"}) | Amount: $${order.totalAmount} | Days since invoiced: ${daysSinceCreated} | Action: Flag for dunning outreach`)
      await appendO2CLog("Collections", `Dunning recommended — ${order.customer.name} has an open invoice of $${order.totalAmount} (Order #${order.orderNumber}) with no payment received. Schedule follow-up contact.`)
      await appendO2CLog("Orchestrator", `O2C Collections flow COMPLETED | Order #${order.orderNumber} flagged. No financial pipeline triggered until payment is received.`)
      await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "completed", agentLogs: [...currentLogs, ...logs] } })

      await createNotification({
        organizationId: orgId,
        type: "WARNING",
        title: "Collections Risk",
        message: `Order #${order.orderNumber} from ${order.customer.name} was flagged for dunning outreach.`,
        link: `/sales-orders/${salesOrderId}`
      })
    } else {
      await appendO2CLog("Orchestrator", `O2C Workflow SKIPPED | Order #${order.orderNumber} is in status "${order.status}" — expected PAID or INVOICED. No action taken.`)
      await appendO2CLog("Orchestrator", `O2C Workflow ERROR | Invalid order status.`)
      await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "error", agentLogs: [...currentLogs, ...logs] } })
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
    await prisma.salesOrder.update({ where: { id: salesOrderId }, data: { workflowStatus: "error", agentLogs: [...currentLogs, ...logs] } }).catch(() => {})
    
    await createNotification({
      organizationId: orgId,
      type: "ERROR",
      title: "O2C Workflow Failed",
      message: `Error processing sales order #${order.orderNumber}.`,
      link: `/sales-orders/${salesOrderId}`
    }).catch(() => {})
  }
}

export async function startCashApplicationWorkflow(paymentId: string, organizationId: string) {
  try {
    const result = await runCashApplicationAgent(paymentId, organizationId)
    if (result.status === "ERROR") {
      await createNotification({
        organizationId,
        type: "ERROR",
        title: "Payment Application Failed",
        message: result.message,
        link: `/invoices`,
      })
    } else {
      await createNotification({
        organizationId,
        type: "SUCCESS",
        title: "Payment Applied",
        message: result.message,
        link: result.transactionId ? `/transactions/${result.transactionId}` : `/invoices`,
      })
    }
    return result
  } catch (error: any) {
    console.error("Cash application workflow error:", error)
    await createNotification({
      organizationId,
      type: "ERROR",
      title: "Payment Application Error",
      message: error.message,
      link: `/invoices`,
    }).catch(() => {})
  }
}

export async function startCreditNoteWorkflow(creditNoteId: string, organizationId: string) {
  try {
    const result = await runCreditNoteAgent(creditNoteId, organizationId)
    if (result.status === "ERROR") {
      await createNotification({
        organizationId,
        type: "ERROR",
        title: "Credit Note Failed",
        message: result.message,
        link: `/invoices`,
      })
    } else {
      await createNotification({
        organizationId,
        type: "SUCCESS",
        title: "Credit Note Issued",
        message: result.message,
        link: result.reversalTransactionId ? `/transactions/${result.reversalTransactionId}` : `/invoices`,
      })
    }
    return result
  } catch (error: any) {
    console.error("Credit note workflow error:", error)
    await createNotification({
      organizationId,
      type: "ERROR",
      title: "Credit Note Error",
      message: error.message,
      link: `/invoices`,
    }).catch(() => {})
  }
}

export async function startVendorPaymentWorkflow(vendorPaymentId: string, organizationId: string) {
  try {
    const result = await runPaymentSchedulerAgent(vendorPaymentId, organizationId)
    if (result.status === "ERROR") {
      await createNotification({
        organizationId,
        type: "ERROR",
        title: "Vendor Payment Failed",
        message: result.message,
        link: `/vendor-invoices`,
      })
    } else {
      await createNotification({
        organizationId,
        type: "SUCCESS",
        title: "Vendor Payment Recorded",
        message: result.message,
        link: `/vendor-invoices`,
      })
    }
    return result
  } catch (error: any) {
    console.error("Vendor payment workflow error:", error)
    await createNotification({
      organizationId,
      type: "ERROR",
      title: "Vendor Payment Error",
      message: error.message,
      link: `/vendor-invoices`,
    }).catch(() => {})
  }
}
