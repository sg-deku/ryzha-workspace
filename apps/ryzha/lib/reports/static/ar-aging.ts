import { prisma } from "@/lib/prisma"

export async function getARAging(_params: any, orgId: string) {
  const now = new Date()

  const outstanding = await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["SENT", "DRAFT"] },
    },
    select: { invoiceNumber: true, clientName: true, dueDate: true, total: true },
  })

  const buckets: Record<string, { count: number; total: number; invoices: any[] }> = {
    current: { count: 0, total: 0, invoices: [] },
    "1-30": { count: 0, total: 0, invoices: [] },
    "31-60": { count: 0, total: 0, invoices: [] },
    "61-90": { count: 0, total: 0, invoices: [] },
    "90+": { count: 0, total: 0, invoices: [] },
  }

  for (const inv of outstanding) {
    const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    let bucket: string
    if (daysOverdue <= 0) bucket = "current"
    else if (daysOverdue <= 30) bucket = "1-30"
    else if (daysOverdue <= 60) bucket = "31-60"
    else if (daysOverdue <= 90) bucket = "61-90"
    else bucket = "90+"

    buckets[bucket].count += 1
    buckets[bucket].total += inv.total
    buckets[bucket].invoices.push({ ...inv, daysOverdue: Math.max(0, daysOverdue) })
  }

  return Object.entries(buckets).map(([bucket, data]) => ({ bucket, ...data }))
}
