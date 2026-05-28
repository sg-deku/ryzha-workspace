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
  const { amount, reason, reasonCategory, issueDate, refundMethod, refundDate, referenceNumber, notes } = body

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
  }
  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 })
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

  const cnDate = issueDate ? new Date(issueDate) : new Date()

  const creditNote = await prisma.creditNote.create({
    data: {
      invoiceId: id,
      amount: parseFloat(amount),
      reason,
      reasonCategory: reasonCategory || "other",
      issueDate: cnDate,
      refundMethod: refundMethod || null,
      refundDate: refundDate ? new Date(refundDate) : null,
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      createdById: session.user.id,
      organizationId: session.user.organizationId,
    },
  })

  after(
    Promise.all([
      createSystemJournalEntry({
        organizationId: session.user.organizationId,
        sourceType: "CreditNote",
        sourceId: creditNote.id,
        reference: `CN-${creditNote.id.slice(-6)}`,
        description: `Credit note – ${invoice.invoiceNumber} (${invoice.clientName})`,
        entryDate: cnDate,
        lines: [
          {
            accountName: "Service Revenue",
            accountType: "Revenue",
            debit: parseFloat(amount),
            credit: 0,
            description: `Revenue reversed – ${invoice.invoiceNumber}`,
          },
          {
            accountName: "Accounts Receivable",
            accountType: "Assets",
            debit: 0,
            credit: parseFloat(amount),
            description: `AR credited – ${invoice.invoiceNumber} (${invoice.clientName})`,
          },
        ],
      }),
      startCreditNoteWorkflow(creditNote.id, session.user.organizationId),
    ]).catch(console.error)
  )

  return NextResponse.json(creditNote, { status: 201 })
}
