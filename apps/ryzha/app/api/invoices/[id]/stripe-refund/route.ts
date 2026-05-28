import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripeForOrg } from "@/lib/stripe"
import { after } from "next/server"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { amount, reason, stripeRefundMode } = body

  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
  }

  const orgId = session.user.organizationId

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: { payments: { select: { amount: true, referenceNumber: true, method: true } } },
  })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

  const stripePayment = invoice.payments.find((p) => p.method === "stripe" && p.referenceNumber)
  if (!stripePayment?.referenceNumber) {
    return NextResponse.json({ error: "No Stripe payment found on this invoice. Only Stripe-paid invoices can be refunded via the Stripe API." }, { status: 400 })
  }

  const paymentIntentId = stripePayment.referenceNumber

  const transaction = await prisma.transaction.findFirst({
    where: { organizationId: orgId, stripePaymentIntentId: paymentIntentId },
    select: { id: true, stripeChargeId: true }
  })

  if (!transaction?.stripeChargeId) {
    return NextResponse.json({ error: "No Stripe charge ID found for this payment. The payment may not have been fully processed." }, { status: 400 })
  }

  const refundAmountCents = Math.round(parseFloat(amount) * 100)

  let stripe
  try {
    stripe = await getStripeForOrg(orgId)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  let stripeRefund
  try {
    stripeRefund = await stripe.refunds.create({
      charge: transaction.stripeChargeId,
      amount: refundAmountCents,
      reason: "requested_by_customer",
      metadata: {
        organizationId: orgId,
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
        initiatedBy: session.user.email || session.user.id,
        refundMode: stripeRefundMode || "immediate",
      },
    })
  } catch (e: any) {
    console.error("[stripe-refund] Stripe API error:", e)
    return NextResponse.json({ error: `Stripe error: ${e.message}` }, { status: 400 })
  }

  const refundAmount = parseFloat(amount)
  const refundDate = new Date()
  const cnReason = reason || `Stripe refund – ${invoice.invoiceNumber}`

  const creditNote = await prisma.creditNote.create({
    data: {
      invoiceId: id,
      amount: refundAmount,
      reason: cnReason,
      reasonCategory: "other",
      refundType: "stripe_refund",
      refundMethod: "stripe",
      referenceNumber: stripeRefund.id,
      issueDate: refundDate,
      createdById: session.user.id,
      organizationId: orgId,
      transactionId: transaction.id,
    },
  })

  after(
    createSystemJournalEntry({
      organizationId: orgId,
      sourceType: "Refund",
      sourceId: stripeRefund.id,
      reference: `REF-${stripeRefund.id.slice(-8)}`,
      description: `Stripe refund – ${invoice.invoiceNumber} ($${refundAmount.toFixed(2)})`,
      entryDate: refundDate,
      lines: [
        {
          accountName: "Service Revenue",
          accountType: "Revenue",
          debit: refundAmount,
          credit: 0,
          description: `Revenue reversed – ${invoice.invoiceNumber}`,
        },
        {
          accountName: "Stripe Clearing Account",
          accountType: "Assets",
          debit: 0,
          credit: refundAmount,
          description: `Stripe refund settlement – ${stripeRefund.id}`,
        },
      ],
    }).catch(console.error)
  )

  return NextResponse.json({
    stripeRefundId: stripeRefund.id,
    stripeStatus: stripeRefund.status,
    creditNoteId: creditNote.id,
    amount: refundAmount,
  }, { status: 201 })
}
