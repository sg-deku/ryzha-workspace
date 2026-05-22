import { prisma } from "@/lib/prisma"

export async function getSpendByVendor(
  params: { startDate?: string; endDate?: string; vendorId?: string },
  orgId: string
) {
  const start = params.startDate ? new Date(params.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 3))
  const end = params.endDate ? new Date(params.endDate) : new Date()

  const vendorInvoices = await prisma.vendorInvoice.findMany({
    where: {
      organizationId: orgId,
      createdAt: { gte: start, lte: end },
      ...(params.vendorId ? { vendorId: params.vendorId } : {}),
    },
    select: { amount: true, vendor: { select: { id: true, name: true } } },
  })

  const byVendor: Record<string, { vendorId: string; vendor: string; total: number }> = {}
  for (const vi of vendorInvoices) {
    const key = vi.vendor.id
    if (!byVendor[key]) {
      byVendor[key] = { vendorId: vi.vendor.id, vendor: vi.vendor.name, total: 0 }
    }
    byVendor[key].total += vi.amount
  }

  return Object.values(byVendor).sort((a, b) => b.total - a.total)
}
