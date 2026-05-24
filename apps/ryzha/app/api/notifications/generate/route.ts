import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId
  const now = new Date()
  const created: string[] = []

  const dedup = async (key: string, data: {
    type: "INFO" | "SUCCESS" | "WARNING" | "ERROR"
    title: string
    message: string
    link?: string
  }) => {
    const exists = await prisma.notification.findFirst({
      where: { organizationId: orgId, title: data.title, message: data.message, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    })
    if (!exists) {
      await prisma.notification.create({ data: { ...data, organizationId: orgId } })
      created.push(key)
    }
  }

  const [overdueInvoices, pendingPOs, failedAudits, pendingExpenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId: orgId, status: { in: ["SENT", "PARTIAL"] }, dueDate: { lt: now } },
      select: { id: true, invoiceNumber: true, clientName: true, total: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.purchaseOrder.findMany({
      where: { organizationId: orgId, status: "PENDING" },
      select: { id: true, poNumber: true, totalAmount: true },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: { organizationId: orgId, auditStatus: "failed" },
      select: { id: true, stripePaymentIntentId: true, amount: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.expense.findMany({
      where: { organizationId: orgId, status: "PENDING" },
      select: { id: true, description: true, amount: true },
      take: 5,
    }),
  ])

  for (const inv of overdueInvoices) {
    const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    await dedup(`overdue-${inv.id}`, {
      type: "WARNING",
      title: `Overdue Invoice: ${inv.invoiceNumber}`,
      message: `Invoice ${inv.invoiceNumber} for ${inv.clientName} ($${inv.total.toFixed(2)}) is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue.`,
      link: `/invoices/${inv.id}`,
    })
  }

  for (const po of pendingPOs) {
    await dedup(`po-${po.id}`, {
      type: "INFO",
      title: `Purchase Order Awaiting Approval`,
      message: `PO ${po.poNumber} for $${po.totalAmount.toFixed(2)} is pending approval.`,
      link: `/purchases/${po.id}`,
    })
  }

  for (const tx of failedAudits) {
    await dedup(`audit-${tx.id}`, {
      type: "ERROR",
      title: `Audit Failed`,
      message: `Transaction $${tx.amount.toFixed(2)} (${tx.stripePaymentIntentId}) failed the audit check. Review and re-run the AI pipeline.`,
      link: `/transactions/${tx.id}`,
    })
  }

  for (const exp of pendingExpenses) {
    await dedup(`expense-${exp.id}`, {
      type: "INFO",
      title: `Expense Pending Approval`,
      message: `Expense "${exp.description}" for $${exp.amount.toFixed(2)} is awaiting approval.`,
      link: `/expenses`,
    })
  }

  return NextResponse.json({ generated: created.length, keys: created })
}
