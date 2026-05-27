import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function BalanceSheetPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const organizationId = session.user.organizationId

  const glEntries = await prisma.generalLedgerEntry.findMany({
    where: { organizationId },
  })

  const buckets: Record<string, { debit: number; credit: number }> = {}

  for (const entry of glEntries) {
    const key = `${entry.accountType}::${entry.accountName}`
    if (!buckets[key]) buckets[key] = { debit: 0, credit: 0 }
    buckets[key].debit += entry.debit
    buckets[key].credit += entry.credit
  }

  const assets: { name: string; balance: number }[] = []
  const liabilities: { name: string; balance: number }[] = []
  const equity: { name: string; balance: number }[] = []

  for (const [key, { debit, credit }] of Object.entries(buckets)) {
    const [type, name] = key.split("::")
    if (type === "Assets") {
      assets.push({ name, balance: debit - credit })
    } else if (type === "Liabilities") {
      liabilities.push({ name, balance: credit - debit })
    } else if (type === "Equity") {
      equity.push({ name, balance: credit - debit })
    }
  }

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0)
  const totalEquity = equity.reduce((s, a) => s + a.balance, 0)
  const retainedEarnings = totalAssets - totalLiabilities - totalEquity

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Balance Sheet</h2>
            <p className="text-muted-foreground">As of {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/reports/export?type=balance-sheet" download>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </a>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assets.map((a) => (
                <div key={a.name} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{a.name}</span>
                  <span className="font-medium">{formatCurrency(a.balance)}</span>
                </div>
              ))}
              {assets.length === 0 && (
                <p className="text-sm text-muted-foreground">No asset entries yet</p>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Assets</span>
                <span>{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {liabilities.map((l) => (
                <div key={l.name} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{l.name}</span>
                  <span className="font-medium">{formatCurrency(l.balance)}</span>
                </div>
              ))}
              {liabilities.length === 0 && (
                <p className="text-sm text-muted-foreground">No liability entries yet</p>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Liabilities</span>
                <span>{formatCurrency(totalLiabilities)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {equity.map((e) => (
                <div key={e.name} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{e.name}</span>
                  <span className="font-medium">{formatCurrency(e.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Retained Earnings</span>
                <span className="font-medium">{formatCurrency(retainedEarnings)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Equity</span>
                <span>{formatCurrency(totalEquity + retainedEarnings)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Liabilities + Equity</span>
            <span className={totalLiabilities + totalEquity + retainedEarnings === totalAssets ? "text-green-600" : "text-red-600"}>
              {formatCurrency(totalLiabilities + totalEquity + retainedEarnings)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {totalLiabilities + totalEquity + retainedEarnings === totalAssets
              ? "Balance sheet is balanced."
              : "Balance sheet is not balanced — check GL entries for missing accounts."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
