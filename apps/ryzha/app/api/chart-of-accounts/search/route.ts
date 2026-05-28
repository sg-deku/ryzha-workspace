import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { DEFAULT_CHART_OF_ACCOUNTS } from "@/lib/reports/general-ledger/account-mapping"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.toLowerCase() || ""
  const type = searchParams.get("type") || ""

  const dbAccounts = await prisma.chartOfAccounts.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(type ? { accountType: type } : {}),
    },
    select: { accountName: true, accountType: true, accountCode: true },
    orderBy: { accountName: "asc" },
  })

  const allAccounts =
    dbAccounts.length > 0
      ? dbAccounts
      : DEFAULT_CHART_OF_ACCOUNTS.filter((a) => !type || a.accountType === type).map((a) => ({
          accountName: a.accountName,
          accountType: a.accountType,
          accountCode: null,
        }))

  const filtered = q
    ? allAccounts.filter((a) => a.accountName.toLowerCase().includes(q))
    : allAccounts

  return NextResponse.json(filtered)
}
