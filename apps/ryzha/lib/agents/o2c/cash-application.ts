import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"
import { startAgentWorkflow } from "@/lib/agents/orchestrator"

async function recalculateInvoiceStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      payments: { select: { amount: true } },
      creditNotes: { select: { amount: true } },
    },
  })
  if (!invoice) return

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const totalCredits = invoice.creditNotes.reduce((s, c) => s + c.amount, 0)
  const netOutstanding = invoice.total - totalPaid + totalCredits

  let status: string = invoice.status as string
  if (netOutstanding <= 0) {
    status = "PAID"
  } else if (totalPaid > 0) {
    status = "PARTIAL"
  }

  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: status as any } })
  return { totalPaid, totalCredits, netOutstanding, status }
}

export async function runCashApplicationAgent(paymentId: string, organizationId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          payments: { select: { amount: true } },
          creditNotes: { select: { amount: true } },
        },
      },
    },
  })

  if (!payment) {
    return { agent: "Cash Application Agent", status: "ERROR", message: "Payment not found." }
  }

  const invoice = payment.invoice
  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const invoiceTotal = invoice.total
  const paymentFraction = Math.min(payment.amount / invoiceTotal, 1)
  const isPartial = totalPaid < invoiceTotal

  let aiClassification = "immediate"
  let aiReason = ""

  try {
    const response = await callLLM(organizationId, [
      {
        role: "system",
        content: `You are a cash application specialist. Classify this payment and determine revenue recognition.
        Respond with JSON: { "classification": "full"|"partial"|"overpayment", "revenue_type": "immediate"|"deferred", "notes": string }`,
      },
      {
        role: "user",
        content: `Invoice total: $${invoiceTotal}, Payment amount: $${payment.amount}, Previously paid: $${totalPaid - payment.amount}, Invoice: ${invoice.clientName} - ${invoice.invoiceNumber}, Method: ${payment.method}`,
      },
    ], "agent_cash_application", { temperature: 0 })

    const parsed = parseAIJson(response.content as string)
    aiClassification = parsed.revenue_type || "immediate"
    aiReason = parsed.notes || ""
  } catch (e) {
    console.error("[CashApp] AI classification failed, using defaults", e)
  }

  await recalculateInvoiceStatus(invoice.id)

  const intentId = `pay-${paymentId}-${Date.now()}`
  const transaction = await prisma.transaction.create({
    data: {
      stripePaymentIntentId: intentId,
      amount: payment.amount,
      description: `Payment received: Invoice ${invoice.invoiceNumber} from ${invoice.clientName}${isPartial ? ` (partial: ${(paymentFraction * 100).toFixed(0)}% of $${invoiceTotal})` : ""} via ${payment.method}${payment.referenceNumber ? ` ref: ${payment.referenceNumber}` : ""}`,
      customerEmail: invoice.clientEmail,
      organizationId,
      agentLogs: [],
      revenueRecognitionType: aiClassification,
    },
  })

  await prisma.payment.update({ where: { id: paymentId }, data: { transactionId: transaction.id } })

  await startAgentWorkflow(transaction.id)

  return {
    agent: "Cash Application Agent",
    status: "COMPLETED",
    transactionId: transaction.id,
    paymentFraction,
    isPartial,
    aiReason,
    message: `$${payment.amount} applied to Invoice ${invoice.invoiceNumber}. ${isPartial ? `Invoice now ${(paymentFraction * 100).toFixed(0)}% paid.` : "Invoice fully paid."} Revenue pipeline triggered.`,
  }
}

export { recalculateInvoiceStatus }
