import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, XCircle, BookOpen, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

const ACCOUNT_TYPE_ORDER = ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"]

const TYPE_COLORS: Record<string, string> = {
  Assets: "text-blue-700 dark:text-blue-400",
  Liabilities: "text-orange-700 dark:text-orange-400",
  Equity: "text-purple-700 dark:text-purple-400",
  Revenue: "text-green-700 dark:text-green-400",
  Expenses: "text-red-700 dark:text-red-400",
}

const TYPE_BG: Record<string, string> = {
  Assets: "bg-blue-50 dark:bg-blue-950/20",
  Liabilities: "bg-orange-50 dark:bg-orange-950/20",
  Equity: "bg-purple-50 dark:bg-purple-950/20",
  Revenue: "bg-green-50 dark:bg-green-950/20",
  Expenses: "bg-red-50 dark:bg-red-950/20",
}

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const { period } = await searchParams
  const orgId = session.user.organizationId

  const glEntries = await prisma.generalLedgerEntry.findMany({
    where: {
      organizationId: orgId,
      ...(period ? { date: { gte: new Date(`${period}-01`), lt: new Date(`${period}-01`).setMonth(new Date(`${period}-01`).getMonth() + 1) > 0 ? new Date(new Date(`${period}-01`).setMonth(new Date(`${period}-01`).getMonth() + 1)) : undefined } } : {}),
    },
    orderBy: { accountName: "asc" },
  })

  const accountMap = new Map<string, { accountType: string; debit: number; credit: number }>()

  for (const entry of glEntries) {
    const key = entry.accountName
    const existing = accountMap.get(key) ?? { accountType: entry.accountType, debit: 0, credit: 0 }
    existing.debit += entry.debit
    existing.credit += entry.credit
    accountMap.set(key, existing)
  }

  const accounts = Array.from(accountMap.entries()).map(([name, data]) => ({
    name,
    ...data,
    net: data.debit - data.credit,
  }))

  const sorted = ACCOUNT_TYPE_ORDER.flatMap((type) =>
    accounts.filter((a) => a.accountType === type).sort((a, b) => a.name.localeCompare(b.name))
  )

  const totalDebit = sorted.reduce((s, a) => s + a.debit, 0)
  const totalCredit = sorted.reduce((s, a) => s + a.credit, 0)
  const diff = Math.abs(totalDebit - totalCredit)
  const isBalanced = diff < 0.01

  const byType = ACCOUNT_TYPE_ORDER.reduce<Record<string, typeof sorted>>((acc, t) => {
    acc[t] = sorted.filter((a) => a.accountType === t)
    return acc
  }, {})

  const fmt = (n: number) =>
    n === 0 ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trial Balance</h2>
          <p className="text-muted-foreground">
            Aggregated from General Ledger · All accounts{period ? ` · ${period}` : " · All time"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports/general-ledger">
              <BookOpen className="mr-2 h-4 w-4" /> General Ledger
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/journal-entries/new">
              <TrendingUp className="mr-2 h-4 w-4" /> New Entry
            </Link>
          </Button>
        </div>
      </div>

      <Card className={isBalanced ? "border-green-200 dark:border-green-800" : "border-red-300 dark:border-red-800"}>
        <CardContent className="pt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isBalanced ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {isBalanced ? "Trial balance is in balance" : `Out of balance by $${diff.toFixed(2)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {isBalanced
                  ? "Total debits equal total credits — double-entry integrity confirmed"
                  : "Investigate unbalanced GL entries before closing the period"}
              </p>
            </div>
          </div>
          <div className="flex gap-8 text-right">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Debits</div>
              <div className="text-xl font-bold font-mono">${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Credits</div>
              <div className="text-xl font-bold font-mono">${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {ACCOUNT_TYPE_ORDER.map((type) => {
        const rows = byType[type]
        if (!rows || rows.length === 0) return null
        const typeDebit = rows.reduce((s, r) => s + r.debit, 0)
        const typeCredit = rows.reduce((s, r) => s + r.credit, 0)

        return (
          <Card key={type} className="overflow-hidden">
            <CardHeader className={`py-3 px-6 ${TYPE_BG[type]}`}>
              <div className="flex items-center justify-between">
                <CardTitle className={`text-base font-semibold ${TYPE_COLORS[type]}`}>{type}</CardTitle>
                <div className="flex gap-8 text-sm font-mono text-right">
                  <div>
                    <span className="text-muted-foreground text-xs mr-2">DR</span>
                    <span className="font-semibold">{fmt(typeDebit)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs mr-2">CR</span>
                    <span className="font-semibold">{fmt(typeCredit)}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left px-6 py-2 font-medium">Account</th>
                    <th className="text-right px-6 py-2 font-medium w-40">Debit</th>
                    <th className="text-right px-6 py-2 font-medium w-40">Credit</th>
                    <th className="text-right px-6 py-2 font-medium w-40">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.name} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="px-6 py-2 font-medium text-sm">{row.name}</td>
                      <td className="px-6 py-2 text-right font-mono text-sm">{fmt(row.debit)}</td>
                      <td className="px-6 py-2 text-right font-mono text-sm">{fmt(row.credit)}</td>
                      <td className={`px-6 py-2 text-right font-mono text-sm font-semibold ${row.net >= 0 ? "text-foreground" : "text-red-600"}`}>
                        {row.net === 0 ? "—" : `${row.net < 0 ? "-" : ""}$${Math.abs(row.net).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold bg-muted/30">
                    <td className="px-6 py-2 text-sm">Subtotal — {type}</td>
                    <td className="px-6 py-2 text-right font-mono text-sm">{fmt(typeDebit)}</td>
                    <td className="px-6 py-2 text-right font-mono text-sm">{fmt(typeCredit)}</td>
                    <td className="px-6 py-2 text-right font-mono text-sm">{fmt(typeDebit - typeCredit)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        )
      })}

      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm uppercase tracking-wide">Grand Total</span>
            <div className="flex gap-8 text-right">
              <div>
                <span className="text-xs text-muted-foreground mr-2">Total DR</span>
                <span className="font-bold font-mono">${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground mr-2">Total CR</span>
                <span className="font-bold font-mono">${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                {isBalanced ? (
                  <Badge variant="default" className="bg-green-600">Balanced</Badge>
                ) : (
                  <Badge variant="destructive">Unbalanced</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {sorted.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">No GL entries found</p>
            <p className="text-sm">Post journal entries or trigger a GL sync to populate the trial balance.</p>
            <div className="flex justify-center gap-3 mt-6">
              <Button asChild variant="outline">
                <Link href="/journal-entries/new">Create Journal Entry</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
