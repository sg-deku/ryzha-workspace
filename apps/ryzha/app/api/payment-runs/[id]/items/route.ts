import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const run = await prisma.paymentRun.findUnique({ where: { id, organizationId: session.user.organizationId } })
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (run.status !== "DRAFT") return NextResponse.json({ error: "Can only add items to DRAFT runs" }, { status: 400 })

  const { invoiceIds } = await req.json()
  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    return NextResponse.json({ error: "invoiceIds array required" }, { status: 400 })
  }

  const invoices = await prisma.vendorInvoice.findMany({
    where: {
      id: { in: invoiceIds },
      organizationId: session.user.organizationId,
    },
    include: { vendorPayments: { select: { amount: true } } },
  })

  const created = []
  const skipped = []

  for (const invoice of invoices) {
    const totalPaid = invoice.vendorPayments.reduce((s, p) => s + p.amount, 0)
    const outstanding = invoice.amount - totalPaid

    if (outstanding <= 0.01) {
      skipped.push({ invoiceId: invoice.id, reason: "Already fully paid" })
      continue
    }

    try {
      const item = await prisma.paymentRunItem.create({
        data: {
          paymentRunId: id,
          vendorInvoiceId: invoice.id,
          vendorId: invoice.vendorId,
          amount: Math.round(outstanding * 100) / 100,
        },
      })
      created.push(item)
    } catch {
      skipped.push({ invoiceId: invoice.id, reason: "Already in this run" })
    }
  }

  const totalAmount = await prisma.paymentRunItem.aggregate({
    where: { paymentRunId: id },
    _sum: { amount: true },
  })

  await prisma.paymentRun.update({
    where: { id },
    data: { totalAmount: totalAmount._sum.amount ?? 0 },
  })

  return NextResponse.json({ created: created.length, skipped })
}
