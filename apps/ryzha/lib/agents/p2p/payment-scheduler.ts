import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

async function recalculateVendorInvoiceStatus(vendorInvoiceId: string) {
  const invoice = await prisma.vendorInvoice.findUnique({
    where: { id: vendorInvoiceId },
    include: { vendorPayments: { select: { amount: true } } },
  })
  if (!invoice) return

  const totalPaid = invoice.vendorPayments.reduce((s, p) => s + p.amount, 0)
  let status = invoice.status
  if (totalPaid >= invoice.amount) {
    status = "PAID"
  } else if (totalPaid > 0) {
    status = "PARTIALLY_PAID"
  }
  await prisma.vendorInvoice.update({ where: { id: vendorInvoiceId }, data: { status } })
  return { totalPaid, status }
}

export async function runPaymentSchedulerAgent(vendorPaymentId: string, organizationId: string) {
  const vendorPayment = await prisma.vendorPayment.findUnique({
    where: { id: vendorPaymentId },
    include: {
      vendorInvoice: {
        include: {
          vendor: true,
          vendorPayments: { select: { amount: true } },
        },
      },
    },
  })

  if (!vendorPayment) {
    return { agent: "Payment Scheduler Agent", status: "ERROR", message: "Vendor payment not found." }
  }

  const invoice = vendorPayment.vendorInvoice
  const vendor = invoice.vendor
  const totalPaid = invoice.vendorPayments.reduce((s, p) => s + p.amount, 0)
  const paymentFraction = Math.min(vendorPayment.amount / invoice.amount, 1)
  const isPartial = totalPaid < invoice.amount

  let category = "Accounts Payable"
  let earlyPaymentDiscount = false
  let aiNotes = ""

  try {
    const daysUntilDue = Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const response = await callLLM(organizationId, [
      {
        role: "system",
        content: `You are an AP specialist. Classify this vendor payment and determine the GL expense category.
        Respond with JSON: { "category": string, "early_payment_discount": boolean, "notes": string }`,
      },
      {
        role: "user",
        content: `Vendor: ${vendor.name}, Invoice: ${invoice.invoiceNumber}, Amount: $${vendorPayment.amount}, Days until due: ${daysUntilDue}, Method: ${vendorPayment.method}`,
      },
    ], "agent_payment_scheduler", { temperature: 0 })

    const parsed = parseAIJson(response.content as string)
    category = parsed.category || category
    earlyPaymentDiscount = parsed.early_payment_discount || false
    aiNotes = parsed.notes || ""
  } catch (e) {
    console.error("[PaymentScheduler] AI classification failed, using defaults", e)
  }

  const expense = await prisma.expense.create({
    data: {
      amount: vendorPayment.amount,
      description: `Payment to ${vendor.name} — Invoice ${invoice.invoiceNumber}${vendorPayment.referenceNumber ? ` (ref: ${vendorPayment.referenceNumber})` : ""}${isPartial ? ` [${(paymentFraction * 100).toFixed(0)}% of $${invoice.amount}]` : ""}`,
      category,
      date: vendorPayment.paymentDate,
      organizationId,
      status: "PAID",
    },
  })

  await prisma.vendorPayment.update({ where: { id: vendorPaymentId }, data: { expenseId: expense.id } })

  await prisma.generalLedgerEntry.create({
    data: {
      date: vendorPayment.paymentDate,
      accountType: "Liabilities",
      accountName: "Accounts Payable",
      debit: vendorPayment.amount,
      credit: 0,
      amount: vendorPayment.amount,
      description: `AP payment to ${vendor.name} — ${invoice.invoiceNumber}`,
      sourceType: "vendor_payment",
      sourceId: vendorPaymentId,
      organizationId,
    },
  })

  await prisma.generalLedgerEntry.create({
    data: {
      date: vendorPayment.paymentDate,
      accountType: "Assets",
      accountName: "Cash",
      debit: 0,
      credit: vendorPayment.amount,
      amount: vendorPayment.amount,
      description: `Cash paid to ${vendor.name} — ${invoice.invoiceNumber}`,
      sourceType: "vendor_payment",
      sourceId: vendorPaymentId,
      organizationId,
    },
  })

  await recalculateVendorInvoiceStatus(invoice.id)

  return {
    agent: "Payment Scheduler Agent",
    status: "COMPLETED",
    expenseId: expense.id,
    isPartial,
    earlyPaymentDiscount,
    aiNotes,
    message: `$${vendorPayment.amount} paid to ${vendor.name} (Invoice ${invoice.invoiceNumber}). ${isPartial ? `${(paymentFraction * 100).toFixed(0)}% paid.` : "Fully paid."} Expense and GL entries created. Category: ${category}.`,
  }
}

export { recalculateVendorInvoiceStatus }
