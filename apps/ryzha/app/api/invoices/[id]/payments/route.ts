import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startCashApplicationWorkflow } from "@/lib/agents/orchestrator"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payments = await prisma.payment.findMany({
    where: { invoiceId: id, organizationId: session.user.organizationId },
    orderBy: { paymentDate: "desc" },
  })
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { amount, paymentDate, method, referenceNumber, notes } = body

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: {
      payments: { select: { amount: true } },
      creditNotes: { select: { amount: true } },
    },
  })

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const totalCredits = invoice.creditNotes.reduce((s, c) => s + c.amount, 0)
  const outstanding = invoice.total - totalPaid + totalCredits

  if (amount > outstanding + 0.01) {
    return NextResponse.json(
      { error: `Payment amount ($${amount}) exceeds outstanding balance ($${outstanding.toFixed(2)})` },
      { status: 400 }
    )
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId: id,
      amount: parseFloat(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      method: method || "bank_transfer",
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      createdById: session.user.id,
      organizationId: session.user.organizationId,
    },
  })

  startCashApplicationWorkflow(payment.id, session.user.organizationId).catch(console.error)

  return NextResponse.json(payment, { status: 201 })
}
