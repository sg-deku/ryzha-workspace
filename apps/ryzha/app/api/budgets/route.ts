import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const budgets = await prisma.budget.findMany({
    where: { organizationId: session.user.organizationId },
    include: { _count: { select: { lines: true } } },
    orderBy: [{ fiscalYear: "desc" }, { createdAt: "desc" }],
  })
  return NextResponse.json(budgets)
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, fiscalYear, period, currency, lines } = await req.json()
    if (!name || !fiscalYear) {
      return NextResponse.json({ error: "name and fiscalYear required" }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { currency: true },
    })

    const budget = await prisma.budget.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: session.user.organizationId,
        name,
        fiscalYear: Number(fiscalYear),
        period: period ?? "MONTHLY",
        currency: currency ?? org?.currency ?? "USD",
        status: "DRAFT",
        lines: lines?.length
          ? {
              create: lines.map((l: any) => ({
                id: crypto.randomUUID(),
                accountName: l.accountName,
                accountType: l.accountType ?? "Expenses",
                periodLabel: l.periodLabel,
                budgeted: Number(l.budgeted),
                notes: l.notes ?? null,
              })),
            }
          : undefined,
      },
      include: { lines: true },
    })

    return NextResponse.json(budget)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
