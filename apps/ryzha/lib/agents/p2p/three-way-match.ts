import { prisma } from "@/lib/prisma"

export interface ThreeWayMatchResult {
  status: "PASS" | "WARN" | "FAIL"
  invoiceStatus: string
  hasPO: boolean
  poMatched: boolean
  amountDiff: number
  lineVariances: { description: string; invoiceAmt: number; poAmt: number; diff: number }[]
  message: string
}

function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim()
}

function descriptionSimilar(a: string, b: string): boolean {
  const na = normalise(a)
  const nb = normalise(b)
  if (na === nb) return true
  const wordsA = na.split(/\s+/).filter(w => w.length > 2)
  const wordsB = nb.split(/\s+/).filter(w => w.length > 2)
  if (wordsA.length === 0 || wordsB.length === 0) return false
  const matched = wordsA.filter(w => wordsB.includes(w))
  return matched.length / Math.max(wordsA.length, wordsB.length) >= 0.5
}

export async function runThreeWayMatchAgent(vendorPaymentId: string): Promise<ThreeWayMatchResult> {
  const payment = await prisma.vendorPayment.findUnique({
    where: { id: vendorPaymentId },
    include: {
      vendorInvoice: {
        include: {
          purchaseOrder: {
            include: {
              lineItems: { select: { productId: true, description: true, quantity: true, unitPrice: true, amount: true } },
            },
          },
          vendor: { select: { name: true } },
          vendorPayments: { select: { amount: true } },
          lineItems: { select: { productId: true, description: true, quantity: true, unitPrice: true, amount: true } },
        },
      },
    },
  })

  if (!payment) {
    return { status: "FAIL", invoiceStatus: "unknown", hasPO: false, poMatched: false, amountDiff: 0, lineVariances: [], message: "Vendor payment record not found." }
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
      lineVariances: [],
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
      lineVariances: [],
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
      lineVariances: [],
      message: `No PO linked to invoice ${invoice.invoiceNumber}. Two-way match only. Payment amount $${payment.amount} within outstanding balance $${outstanding.toFixed(2)}.`,
    }
  }

  const po = invoice.purchaseOrder
  const headerDiff = Math.abs(invoice.amount - po.totalAmount)
  const headerMatched = headerDiff <= 0.01

  const lineVariances: ThreeWayMatchResult["lineVariances"] = []
  const invoiceLines = invoice.lineItems
  const poLines = po.lineItems

  for (const invLine of invoiceLines) {
    const match = poLines.find(pl =>
      (invLine.productId && invLine.productId === pl.productId) ||
      descriptionSimilar(invLine.description, pl.description)
    )
    if (!match) {
      lineVariances.push({ description: invLine.description, invoiceAmt: invLine.amount, poAmt: 0, diff: invLine.amount })
    } else {
      const diff = Math.abs(invLine.amount - match.amount)
      if (diff > 0.01) {
        lineVariances.push({ description: invLine.description, invoiceAmt: invLine.amount, poAmt: match.amount, diff })
      }
    }
  }

  const hasLineVariances = lineVariances.length > 0
  const overallStatus = !headerMatched || hasLineVariances ? "WARN" : "PASS"

  const varianceSummary = hasLineVariances
    ? ` Line variances: ${lineVariances.map(v => `${v.description} (invoice $${v.invoiceAmt.toFixed(2)} vs PO $${v.poAmt.toFixed(2)})`).join("; ")}.`
    : ""

  if (overallStatus === "WARN") {
    return {
      status: "WARN",
      invoiceStatus,
      hasPO: true,
      poMatched: headerMatched,
      amountDiff: headerDiff,
      lineVariances,
      message: `Three-way match: header ${headerMatched ? "OK" : `differs by $${headerDiff.toFixed(2)}`}. Invoice ${invoice.invoiceNumber} ↔ PO ${po.poNumber}.${varianceSummary} Payment within outstanding. Flagged for review.`,
    }
  }

  return {
    status: "PASS",
    invoiceStatus,
    hasPO: true,
    poMatched: true,
    amountDiff: 0,
    lineVariances: [],
    message: `Three-way match passed. Invoice ${invoice.invoiceNumber} ↔ PO ${po.poNumber}. Invoice $${invoice.amount} = PO $${po.totalAmount}. All line items matched. Payment $${payment.amount} within outstanding balance $${outstanding.toFixed(2)}.`,
  }
}
