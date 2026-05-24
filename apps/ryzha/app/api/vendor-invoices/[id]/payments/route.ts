import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startVendorPaymentWorkflow } from "@/lib/agents/orchestrator"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payments = await prisma.vendorPayment.findMany({
    where: { vendorInvoiceId: id, organizationId: session.user.organizationId },
    orderBy: { paymentDate: "desc" },
  })
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { amount, paymentDate, method, referenceNumber, notes } = body

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
  }

  const invoice = await prisma.vendorInvoice.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: { vendorPayments: { select: { amount: true } } },
  })
  if (!invoice) return NextResponse.json({ error: "Vendor invoice not found" }, { status: 404 })

  const totalPaid = invoice.vendorPayments.reduce((s, p) => s + p.amount, 0)
  const outstanding = invoice.amount - totalPaid

  if (amount > outstanding + 0.01) {
    return NextResponse.json(
      { error: `Payment amount ($${amount}) exceeds outstanding balance ($${outstanding.toFixed(2)})` },
      { status: 400 }
    )
  }

  const vendorPayment = await prisma.vendorPayment.create({
    data: {
      vendorInvoiceId: id,
      amount: parseFloat(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      method: method || "bank_transfer",
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      createdById: session.user.id,
      organizationId: session.user.organizationId,
    },
  })

  startVendorPaymentWorkflow(vendorPayment.id, session.user.organizationId).catch(console.error)

  return NextResponse.json(vendorPayment, { status: 201 })
}
