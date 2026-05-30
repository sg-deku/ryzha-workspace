import { prisma } from "@/lib/prisma"

export interface ThreeWayMatchResult {
  status: "PASS" | "WARN" | "FAIL"
  invoiceStatus: string
  hasPO: boolean
  poMatched: boolean
  amountDiff: number
  message: string
}

export async function runThreeWayMatchAgent(vendorPaymentId: string): Promise<ThreeWayMatchResult> {
  const payment = await prisma.vendorPayment.findUnique({
    where: { id: vendorPaymentId },
    include: {
      vendorInvoice: {
        include: {
          purchaseOrder: { select: { poNumber: true, totalAmount: true, status: true } },
          vendor: { select: { name: true } },
          vendorPayments: { select: { amount: true } },
        },
      },
    },
  })

  if (!payment) {
    return { status: "FAIL", invoiceStatus: "unknown", hasPO: false, poMatched: false, amountDiff: 0, message: "Vendor payment record not found." }
  }

  const invoice = payment.vendorInvoice
  const invoiceStatus = invoice.status

  const payableStatuses = ["RECEIVED", "MATCHED", "PARTIALLY_PAID", "APPROVED"]
  if (!payableStatuses.includes(invoiceStatus)) {
    return {
      status: "FAIL",
      invoiceStatus,
      hasPO: !!invoice.purchaseOrderId,
      poMatched: false,
      amountDiff: 0,
      message: `Invoice ${invoice.invoiceNumber} is not in a payable state (status: ${invoiceStatus}). Expected: RECEIVED, MATCHED, APPROVED, or PARTIALLY_PAID.`,
    }
  }

  const totalAlreadyPaid = invoice.vendorPayments
    .filter(p => p !== payment)
    .reduce((s, p) => s + p.amount, 0)
  const outstanding = invoice.amount - totalAlreadyPaid

  if (payment.amount > outstanding + 0.01) {
    return {
      status: "FAIL",
      invoiceStatus,
      hasPO: !!invoice.purchaseOrderId,
      poMatched: false,
      amountDiff: payment.amount - outstanding,
      message: `Over-payment detected. Payment $${payment.amount} exceeds outstanding balance $${outstanding.toFixed(2)} on invoice ${invoice.invoiceNumber}.`,
    }
  }

  if (!invoice.purchaseOrderId || !invoice.purchaseOrder) {
    return {
      status: "WARN",
      invoiceStatus,
      hasPO: false,
      poMatched: false,
      amountDiff: 0,
      message: `No PO linked to invoice ${invoice.invoiceNumber}. Two-way match only. Payment amount $${payment.amount} within outstanding balance $${outstanding.toFixed(2)}.`,
    }
  }

  const po = invoice.purchaseOrder
  const amountDiff = Math.abs(invoice.amount - po.totalAmount)
  const poMatched = amountDiff <= 0.01

  if (!poMatched) {
    return {
      status: "WARN",
      invoiceStatus,
      hasPO: true,
      poMatched: false,
      amountDiff,
      message: `PO ${po.poNumber} amount $${po.totalAmount} differs from invoice $${invoice.amount} by $${amountDiff.toFixed(2)}. Three-way match variance — flagged for review. Payment within outstanding balance.`,
    }
  }

  return {
    status: "PASS",
    invoiceStatus,
    hasPO: true,
    poMatched: true,
    amountDiff: 0,
    message: `Three-way match passed. Invoice ${invoice.invoiceNumber} ↔ PO ${po.poNumber}. Invoice $${invoice.amount} = PO $${po.totalAmount}. Payment $${payment.amount} within outstanding balance $${outstanding.toFixed(2)}.`,
  }
}
