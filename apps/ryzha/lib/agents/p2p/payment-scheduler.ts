import { prisma } from "@/lib/prisma"

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

export interface PaymentSchedulerResult {
  status: "COMPLETED" | "ERROR"
  expenseId?: string
  isPartial: boolean
  invoiceStatus: string
  message: string
}

export async function runPaymentSchedulerAgent(
  vendorPaymentId: string,
  organizationId: string,
  suggestedCategory?: string
): Promise<PaymentSchedulerResult> {
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
    return { status: "ERROR", isPartial: false, invoiceStatus: "unknown", message: "Vendor payment not found." }
  }

  const invoice = vendorPayment.vendorInvoice
  const vendor = invoice.vendor
  const totalPaid = invoice.vendorPayments.reduce((s, p) => s + p.amount, 0)
  const paymentFraction = Math.min(vendorPayment.amount / invoice.amount, 1)
  const isPartial = totalPaid < invoice.amount

  const category = suggestedCategory || "Accounts Payable"

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

  const invoiceResult = await recalculateVendorInvoiceStatus(invoice.id)
  const invoiceStatus = invoiceResult?.status ?? invoice.status

  return {
    status: "COMPLETED",
    expenseId: expense.id,
    isPartial,
    invoiceStatus,
    message: `$${vendorPayment.amount} paid to ${vendor.name} (Invoice ${invoice.invoiceNumber}). ${isPartial ? `${(paymentFraction * 100).toFixed(0)}% paid.` : "Fully paid. Invoice marked PAID."} Expense record created. Category: ${category}.`,
  }
}

export { recalculateVendorInvoiceStatus }
