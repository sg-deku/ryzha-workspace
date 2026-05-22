import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const organizationId = session.user.organizationId

  const [pos, sos, expenses, transactions] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),
    prisma.salesOrder.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),
    prisma.expense.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 3
    }),
    prisma.transaction.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
  ])

  const activities = [
    ...pos.map(po => ({
      id: po.id,
      type: "p2p",
      description: `Purchase Order ${po.poNumber || po.id} ${po.status}`,
      timestamp: po.createdAt.toISOString(),
      link: `/purchases/${po.id}`
    })),
    ...sos.map(so => ({
      id: so.id,
      type: "o2c",
      description: `Sales Order ${so.orderNumber || so.id} ${so.status}`,
      timestamp: so.createdAt.toISOString(),
      link: `/sales-orders/${so.id}`
    })),
    ...expenses.map(exp => ({
      id: exp.id,
      type: "expense",
      description: `Expense: ${exp.description}`,
      timestamp: exp.createdAt.toISOString(),
      link: `/expenses`
    })),
    ...transactions.map(tx => ({
      id: tx.id,
      type: "payment",
      description: `Transaction: ${tx.description}`,
      timestamp: tx.createdAt.toISOString(),
      link: `/transactions/${tx.id}`
    }))
  ]

  // Sort by timestamp desc and take top 5
  const sortedActivities = activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  return NextResponse.json(sortedActivities)
}
