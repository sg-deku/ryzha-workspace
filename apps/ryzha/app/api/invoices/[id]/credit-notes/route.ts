import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { after } from "next/server"
import { startCreditNoteWorkflow } from "@/lib/agents/orchestrator"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creditNotes = await prisma.creditNote.findMany({
    where: { invoiceId: id, organizationId: session.user.organizationId },
    orderBy: { issueDate: "desc" },
  })
  return NextResponse.json(creditNotes)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { amount, reason, reasonCategory, refundType, issueDate, refundMethod, refundDate, referenceNumber, notes } = body

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
  }
  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 })
  }

  const resolvedRefundType: string = refundType || "credit_memo"

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: { payments: { select: { amount: true } } },
  })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const isPaid = totalPaid >= invoice.total - 0.01

  const cnDate = issueDate ? new Date(issueDate) : new Date()
  const cnAmount = parseFloat(amount)

  const creditNote = await prisma.creditNote.create({
    data: {
      invoiceId: id,
      amount: cnAmount,
      reason,
      reasonCategory: reasonCategory || "other",
      refundType: resolvedRefundType,
      issueDate: cnDate,
      refundMethod: refundMethod || null,
      refundDate: refundDate ? new Date(refundDate) : null,
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      createdById: session.user.id,
      organizationId: session.user.organizationId,
    },
  })

  const jeLines = buildCreditNoteJELines(resolvedRefundType, isPaid, cnAmount, invoice.invoiceNumber, invoice.clientName)

  after(
    Promise.all([
      createSystemJournalEntry({
        organizationId: session.user.organizationId,
        sourceType: "CreditNote",
        sourceId: creditNote.id,
        reference: `CN-${creditNote.id.slice(-6)}`,
        description: `Credit note – ${invoice.invoiceNumber} (${invoice.clientName}) [${resolvedRefundType}]`,
        entryDate: cnDate,
        lines: jeLines,
      }),
      startCreditNoteWorkflow(creditNote.id, session.user.organizationId),
    ]).catch(console.error)
  )

  return NextResponse.json(creditNote, { status: 201 })
}

function buildCreditNoteJELines(
  refundType: string,
  isPaid: boolean,
  amount: number,
  invoiceNumber: string,
  clientName: string
) {
  if (refundType === "stripe_refund") {
    return [
      {
        accountName: "Service Revenue",
        accountType: "Revenue",
        debit: amount,
        credit: 0,
        description: `Revenue reversed – ${invoiceNumber}`,
      },
      {
        accountName: "Stripe Clearing Account",
        accountType: "Assets",
        debit: 0,
        credit: amount,
        description: `Stripe refund – ${invoiceNumber} (${clientName})`,
      },
    ]
  }

  if (refundType === "cash_refund" || (isPaid && refundType !== "credit_memo")) {
    return [
      {
        accountName: "Service Revenue",
        accountType: "Revenue",
        debit: amount,
        credit: 0,
        description: `Revenue reversed – ${invoiceNumber}`,
      },
      {
        accountName: "Cash",
        accountType: "Assets",
        debit: 0,
        credit: amount,
        description: `Cash refund – ${invoiceNumber} (${clientName})`,
      },
    ]
  }

  return [
    {
      accountName: "Service Revenue",
      accountType: "Revenue",
      debit: amount,
      credit: 0,
      description: `Revenue reversed – ${invoiceNumber}`,
    },
    {
      accountName: "Accounts Receivable",
      accountType: "Assets",
      debit: 0,
      credit: amount,
      description: `AR credited – ${invoiceNumber} (${clientName})`,
    },
  ]
}
