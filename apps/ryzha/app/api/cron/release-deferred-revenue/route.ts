import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"

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

  let totalReleased = 0

  for (const row of due) {
    const orgId = row.transaction.organizationId
    const periodLabel = row.period.toLocaleString("default", { month: "short", year: "numeric" })

    try {
      const je = await createSystemJournalEntry({
        organizationId: orgId,
        sourceType: "DeferredRelease",
        sourceId: row.id,
        reference: `DEF-${row.id.slice(-6)}`,
        description: `Deferred revenue release – ${periodLabel}`,
        entryDate: row.period,
        type: "ADJUSTING",
        period: row.period.toISOString().slice(0, 7),
        lines: [
          {
            accountName: "Deferred Revenue",
            accountType: "Liabilities",
            debit: row.amount,
            credit: 0,
            description: `Deferred revenue released – ${periodLabel}`,
          },
          {
            accountName: "Subscription Revenue",
            accountType: "Revenue",
            debit: 0,
            credit: row.amount,
            description: `${row.transaction.description ?? row.transactionId} – ${periodLabel}`,
          },
        ],
      })

      await prisma.deferredRevenueSchedule.update({
        where: { id: row.id },
        data: {
          recognized: true,
          recognizedAt: now,
          glEntryId: je.id,
        },
      })

      totalReleased++
    } catch (err) {
      console.error(`[deferred-release] Failed for schedule ${row.id}:`, err)
    }
  }

  return NextResponse.json({
    released: totalReleased,
    message: `Released ${totalReleased} deferred revenue schedule entries.`,
  })
}
