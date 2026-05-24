import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"
import { recalculateInvoiceStatus } from "./cash-application"

const REASON_CATEGORIES: Record<string, string> = {
  pricing_error: "Pricing Error",
  return: "Product/Service Return",
  goodwill: "Goodwill Adjustment",
  dispute_settlement: "Dispute Settlement",
  duplicate_charge: "Duplicate Charge",
  other: "Other",
}

export async function runCreditNoteAgent(creditNoteId: string, organizationId: string) {
  const creditNote = await prisma.creditNote.findUnique({
    where: { id: creditNoteId },
    include: {
      invoice: {
        include: {
          payments: { select: { amount: true } },
          creditNotes: { select: { amount: true } },
        },
      },
    },
  })

  if (!creditNote) {
    return { agent: "Credit Note Agent", status: "ERROR", message: "Credit note not found." }
  }

  const invoice = creditNote.invoice
  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const priorCredits = invoice.creditNotes
    .filter((c) => c.id !== creditNoteId)
    .reduce((s, c) => s + c.amount, 0)

  if (creditNote.amount > totalPaid - priorCredits + 0.01) {
    return {
      agent: "Credit Note Agent",
      status: "ERROR",
      message: `Credit note amount ($${creditNote.amount}) exceeds the net amount paid ($${(totalPaid - priorCredits).toFixed(2)}). Cannot issue refund for more than was collected.`,
    }
  }

  let aiReasoning = ""
  let accountingTreatment = "revenue_reversal"
  let deferredReversalAmount = 0

  try {
    const existingTx = creditNote.transactionId
      ? await prisma.transaction.findUnique({ where: { id: creditNote.transactionId } })
      : await prisma.transaction.findFirst({
          where: { organizationId, customerEmail: invoice.clientEmail },
          orderBy: { createdAt: "desc" },
        })

    const deferredRevenue = existingTx?.deferredRevenue ?? 0
    const creditFraction = creditNote.amount / invoice.total
    deferredReversalAmount = deferredRevenue * creditFraction

    const response = await callLLM(organizationId, [
      {
        role: "system",
        content: `You are a revenue accountant. Determine the accounting treatment for this credit note under ASC 606.
        Respond with JSON: { "accounting_treatment": "revenue_reversal"|"deferred_reversal"|"mixed", "recognized_reversal": number, "deferred_reversal": number, "notes": string }`,
      },
      {
        role: "user",
        content: `Invoice: ${invoice.invoiceNumber}, Client: ${invoice.clientName}, Invoice total: $${invoice.total}, Credit note amount: $${creditNote.amount}, Reason: ${creditNote.reason} (${REASON_CATEGORIES[creditNote.reasonCategory] ?? creditNote.reasonCategory}), Existing deferred revenue: $${deferredRevenue}`,
      },
    ], "agent_credit_note", { temperature: 0 })

    const parsed = parseAIJson(response.content as string)
    accountingTreatment = parsed.accounting_treatment || accountingTreatment
    deferredReversalAmount = parsed.deferred_reversal ?? deferredReversalAmount
    aiReasoning = parsed.notes || ""
  } catch (e) {
    console.error("[CreditNote] AI reasoning failed, using defaults", e)
  }

  const intentId = `cn-${creditNoteId}-${Date.now()}`
  const reversalTx = await prisma.transaction.create({
    data: {
      stripePaymentIntentId: intentId,
      amount: -creditNote.amount,
      description: `Credit note issued: Invoice ${invoice.invoiceNumber} — ${invoice.clientName}. Reason: ${creditNote.reason}${creditNote.refundMethod ? ` | Refund via: ${creditNote.refundMethod}` : " | No cash refund (credit applied)"}`,
      customerEmail: invoice.clientEmail,
      organizationId,
      agentLogs: [],
      revenueRecognitionType: accountingTreatment === "deferred_reversal" ? "deferred" : "immediate",
      recognizedRevenue: -creditNote.amount + deferredReversalAmount,
      deferredRevenue: -deferredReversalAmount,
    },
  })

  await prisma.creditNote.update({ where: { id: creditNoteId }, data: { transactionId: reversalTx.id } })

  await prisma.generalLedgerEntry.createMany({
    data: [
      {
        date: creditNote.issueDate,
        accountType: "revenue",
        accountName: "Revenue",
        debit: creditNote.amount,
        credit: 0,
        amount: creditNote.amount,
        description: `Revenue reversal — Credit note ${creditNoteId} on Invoice ${invoice.invoiceNumber}`,
        sourceType: "credit_note",
        sourceId: creditNoteId,
        organizationId,
      },
      {
        date: creditNote.issueDate,
        accountType: "liability",
        accountName: "Accounts Receivable",
        debit: 0,
        credit: creditNote.amount,
        amount: creditNote.amount,
        description: `AR credit — Credit note ${creditNoteId} on Invoice ${invoice.invoiceNumber}`,
        sourceType: "credit_note",
        sourceId: creditNoteId,
        organizationId,
      },
    ],
  })

  const statusResult = await recalculateInvoiceStatus(invoice.id)

  const needsRefund = !!creditNote.refundMethod
  const categoryLabel = REASON_CATEGORIES[creditNote.reasonCategory] ?? creditNote.reasonCategory

  return {
    agent: "Credit Note Agent",
    status: "COMPLETED",
    reversalTransactionId: reversalTx.id,
    accountingTreatment,
    deferredReversalAmount,
    needsRefund,
    invoiceStatus: statusResult?.status,
    aiReasoning,
    message: `Credit note of $${creditNote.amount} issued on Invoice ${invoice.invoiceNumber} (${categoryLabel}). ${needsRefund ? `Cash refund of $${creditNote.amount} via ${creditNote.refundMethod} scheduled.` : "Credit applied to account — no cash refund."} Revenue reversal recorded. ${aiReasoning}`,
  }
}
