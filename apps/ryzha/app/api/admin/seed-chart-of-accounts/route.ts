import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { seedDefaultChartOfAccounts } from "@/lib/default-chart-of-accounts"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId

  const existing = await prisma.chartOfAccounts.count({ where: { organizationId: orgId } })

  await seedDefaultChartOfAccounts(orgId, prisma)

  const after = await prisma.chartOfAccounts.count({ where: { organizationId: orgId } })

  return NextResponse.json({
    message: "Chart of accounts seeded",
    before: existing,
    after,
    added: after - existing,
  })
}
