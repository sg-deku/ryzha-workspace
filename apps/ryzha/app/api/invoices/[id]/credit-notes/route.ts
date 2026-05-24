import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startCreditNoteWorkflow } from "@/lib/agents/orchestrator"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creditNotes = await prisma.creditNote.findMany({
    where: { invoiceId: id, organizationId: session.user.organizationId },
    orderBy: { issueDate: "desc" },
  })
  return NextResponse.json(creditNotes)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
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

  const creditNote = await prisma.creditNote.create({
    data: {
      invoiceId: id,
      amount: parseFloat(amount),
      reason,
      reasonCategory: reasonCategory || "other",
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      refundMethod: refundMethod || null,
      refundDate: refundDate ? new Date(refundDate) : null,
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      createdById: session.user.id,
      organizationId: session.user.organizationId,
    },
  })

  startCreditNoteWorkflow(creditNote.id, session.user.organizationId).catch(console.error)

  return NextResponse.json(creditNote, { status: 201 })
}
