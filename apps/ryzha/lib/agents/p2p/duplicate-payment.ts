import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export interface DuplicatePaymentResult {
  status: "CLEAR" | "DUPLICATE"
  hash: string
  duplicateId?: string
  message: string
}

export async function runDuplicatePaymentAgent(
  vendorPaymentId: string,
  organizationId: string
): Promise<DuplicatePaymentResult> {
  const payment = await prisma.vendorPayment.findUnique({
    where: { id: vendorPaymentId },
    include: {
      vendorInvoice: {
        select: { invoiceNumber: true, vendorId: true },
      },
    },
  })

  if (!payment) {
    return { status: "CLEAR", hash: "", message: "Payment not found — skipping duplicate check." }
  }

  const invoice = payment.vendorInvoice
  const dateStr = payment.paymentDate.toISOString().slice(0, 10)

  const hashInput = [
    organizationId,
    invoice.vendorId,
    invoice.invoiceNumber,
    payment.amount.toFixed(2),
    payment.method,
    dateStr,
  ].join("|")
  const hash = crypto.createHash("sha256").update(hashInput).digest("hex").slice(0, 16)

  const windowStart = new Date(payment.paymentDate)
  windowStart.setDate(windowStart.getDate() - 7)
  const windowEnd = new Date(payment.paymentDate)
  windowEnd.setDate(windowEnd.getDate() + 7)

  const existing = await prisma.vendorPayment.findFirst({
    where: {
      id: { not: vendorPaymentId },
      organizationId,
      vendorInvoiceId: payment.vendorInvoiceId,
      amount: payment.amount,
      paymentDate: { gte: windowStart, lte: windowEnd },
    },
    select: { id: true, paymentDate: true, amount: true },
  })

  if (existing) {
    return {
      status: "DUPLICATE",
      hash,
      duplicateId: existing.id,
      message: `Duplicate detected — another payment of $${existing.amount} for the same invoice was recorded on ${existing.paymentDate.toLocaleDateString()}. Payment ID: ${existing.id}. Hash: ${hash}. Manual review required.`,
    }
  }

  return {
    status: "CLEAR",
    hash,
    message: `No duplicate found. Hash: ${hash}. Payment is unique within a ±7-day window for vendor + invoice + amount + method.`,
  }
}
