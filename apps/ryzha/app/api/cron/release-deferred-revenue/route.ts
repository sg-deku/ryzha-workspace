import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  const due = await prisma.deferredRevenueSchedule.findMany({
    where: {
      recognized: false,
      period: { lte: now },
    },
    include: {
      transaction: {
        select: { organizationId: true, description: true },
      },
    },
  })

  if (due.length === 0) {
    return NextResponse.json({ released: 0, message: "No deferred revenue due for release." })
  }

  const orgMap = new Map<string, typeof due>()
  for (const row of due) {
    const orgId = row.transaction.organizationId
    if (!orgMap.has(orgId)) orgMap.set(orgId, [])
    orgMap.get(orgId)!.push(row)
  }

  let totalReleased = 0

  for (const [orgId, rows] of Array.from(orgMap.entries())) {
    for (const row of rows) {
      const periodLabel = row.period.toLocaleString("default", { month: "short", year: "numeric" })

      const drEntry = await prisma.generalLedgerEntry.create({
        data: {
          date: row.period,
          accountType: "Liabilities",
          accountName: "Deferred Revenue",
          debit: row.amount,
          credit: 0,
          amount: row.amount,
          description: `Deferred revenue release — ${periodLabel} | Tx: ${row.transactionId}`,
          sourceType: "deferred_release",
          sourceId: `${row.id}-dr`,
          organizationId: orgId,
        },
      })

      await prisma.generalLedgerEntry.create({
        data: {
          date: row.period,
          accountType: "Revenue",
          accountName: "Subscription Revenue",
          debit: 0,
          credit: row.amount,
          amount: row.amount,
          description: `Deferred revenue release — ${periodLabel} | ${row.transaction.description ?? row.transactionId}`,
          sourceType: "deferred_release",
          sourceId: `${row.id}-rev`,
          organizationId: orgId,
        },
      })

      await prisma.deferredRevenueSchedule.update({
        where: { id: row.id },
        data: {
          recognized: true,
          recognizedAt: now,
          glEntryId: drEntry.id,
        },
      })

      totalReleased++
    }
  }

  return NextResponse.json({
    released: totalReleased,
    message: `Released ${totalReleased} deferred revenue schedule entries across ${orgMap.size} organizations.`,
  })
}
