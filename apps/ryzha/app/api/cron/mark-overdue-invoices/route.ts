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

  const result = await prisma.invoice.updateMany({
    where: {
      status: { in: ["SENT", "PARTIAL"] },
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  })

  return NextResponse.json({
    markedOverdue: result.count,
    message: `Marked ${result.count} invoice(s) as OVERDUE.`,
    runAt: now.toISOString(),
  })
}
