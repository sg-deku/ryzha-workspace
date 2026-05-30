import { prisma } from "@/lib/prisma"

export interface P2PTreasuryResult {
  totalAPBalance: number
  totalExpenses30d: number
  cashImpactNote: string
  message: string
}

export async function runP2PTreasuryAgent(
  vendorPaymentId: string,
  organizationId: string
): Promise<P2PTreasuryResult> {
  const payment = await prisma.vendorPayment.findUnique({
    where: { id: vendorPaymentId },
    select: { amount: true, paymentDate: true },
  })

  if (!payment) {
    return {
      totalAPBalance: 0,
      totalExpenses30d: 0,
      cashImpactNote: "",
      message: "Payment not found — treasury update skipped.",
    }
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [apAgg, expenseAgg, outstandingInvoices] = await Promise.all([
    prisma.vendorPayment.aggregate({
      where: { organizationId, paymentDate: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { organizationId, date: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.vendorInvoice.aggregate({
      where: {
        organizationId,
        status: { in: ["RECEIVED", "MATCHED", "PARTIALLY_PAID", "APPROVED"] },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ])

  const totalAPBalance = outstandingInvoices._sum.amount ?? 0
  const totalExpenses30d = expenseAgg._sum.amount ?? 0
  const outstandingCount = outstandingInvoices._count.id

  const cashImpactNote = `$${payment.amount.toFixed(2)} cash out. Outstanding AP: $${totalAPBalance.toFixed(2)} across ${outstandingCount} invoice(s). 30-day expenses: $${totalExpenses30d.toFixed(2)}.`

  return {
    totalAPBalance,
    totalExpenses30d,
    cashImpactNote,
    message: `Treasury updated. ${cashImpactNote}`,
  }
}
