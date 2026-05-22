import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { syncGLForOrganization } from "@/lib/reports/general-ledger/sync"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const accountType = searchParams.get("accountType")
  const sourceType = searchParams.get("sourceType")
  const accountName = searchParams.get("accountName")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50")
  const format = searchParams.get("format")
  const refresh = searchParams.get("refresh") === "true"

  if (refresh) {
    try {
      await syncGLForOrganization(orgId)
    } catch (err) {
      console.error("[GL] Sync failed:", err)
    }
  }

  const where: any = { organizationId: orgId }

  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate + "T23:59:59.999Z")
  }

  if (accountType && accountType !== "All") {
    where.accountType = accountType
  }

  if (sourceType && sourceType !== "All") {
    where.sourceType = sourceType
  }

  if (accountName && accountName !== "All") {
    where.accountName = accountName
  }

  const [entries, totalCount] = await Promise.all([
    prisma.generalLedgerEntry.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.generalLedgerEntry.count({ where }),
  ])

  if (format === "csv") {
    const header = "Date,Account Type,Account Name,Description,Debit,Credit,Amount,Source Type,Source ID\n"
    const rows = entries
      .map(
        (e) =>
          `"${e.date.toISOString().split("T")[0]}","${e.accountType}","${e.accountName}","${e.description.replace(/"/g, '""')}",${e.debit},${e.credit},${e.amount},"${e.sourceType}","${e.sourceId}"`
      )
      .join("\n")
    return new Response(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="general-ledger-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  }

  const summaryAgg = await prisma.generalLedgerEntry.groupBy({
    by: ["accountType", "accountName"],
    where,
    _sum: { amount: true, debit: true, credit: true },
    orderBy: { accountType: "asc" },
  })

  const totalsByType = await prisma.generalLedgerEntry.groupBy({
    by: ["accountType"],
    where,
    _sum: { amount: true },
  })

  const kpis = {
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
  }

  for (const row of totalsByType) {
    const amt = row._sum.amount ?? 0
    if (row.accountType === "Revenue") kpis.totalRevenue += amt
    if (row.accountType === "Expenses") kpis.totalExpenses += Math.abs(amt)
  }
  kpis.netIncome = kpis.totalRevenue - kpis.totalExpenses

  const arEntry = await prisma.generalLedgerEntry.aggregate({
    where: { ...where, accountName: "Accounts Receivable" },
    _sum: { amount: true },
  })
  const apEntry = await prisma.generalLedgerEntry.aggregate({
    where: { ...where, accountName: "Accounts Payable" },
    _sum: { amount: true },
  })
  kpis.accountsReceivable = Math.abs(arEntry._sum.amount ?? 0)
  kpis.accountsPayable = Math.abs(apEntry._sum.amount ?? 0)

  return NextResponse.json({
    entries,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    summary: summaryAgg.map((row) => ({
      accountType: row.accountType,
      accountName: row.accountName,
      amount: row._sum.amount ?? 0,
      debit: row._sum.debit ?? 0,
      credit: row._sum.credit ?? 0,
    })),
    kpis,
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  try {
    await syncGLForOrganization(orgId)
    return NextResponse.json({ success: true, message: "GL sync completed" })
  } catch (err: any) {
    console.error("[GL] Sync error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
