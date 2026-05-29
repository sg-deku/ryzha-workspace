import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Sparkles } from "lucide-react"
import { CoaDeleteButton } from "./coa-delete-button"
import { CoaSeedButton } from "./coa-seed-button"

export const dynamic = "force-dynamic"

const TYPE_ORDER = ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"]

const TYPE_COLORS: Record<string, string> = {
  Assets: "bg-blue-100 text-blue-800",
  Liabilities: "bg-red-100 text-red-800",
  Equity: "bg-purple-100 text-purple-800",
  Revenue: "bg-green-100 text-green-800",
  Expenses: "bg-orange-100 text-orange-800",
}

export default async function ChartOfAccountsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const accounts = await prisma.chartOfAccounts.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      parent: { select: { accountName: true } },
      children: { select: { id: true } },
    },
    orderBy: [{ accountType: "asc" }, { accountCode: "asc" }, { accountName: "asc" }],
  })

  const grouped = TYPE_ORDER.reduce<Record<string, typeof accounts>>((acc, type) => {
    acc[type] = accounts.filter((a) => a.accountType === type)
    return acc
  }, {})

  const otherTypes = [...new Set(accounts.map((a) => a.accountType))].filter(
    (t) => !TYPE_ORDER.includes(t)
  )
  for (const type of otherTypes) {
    grouped[type] = accounts.filter((a) => a.accountType === type)
  }

  const allTypes = [...TYPE_ORDER, ...otherTypes].filter((t) => grouped[t]?.length > 0)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chart of Accounts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""} across {allTypes.length} type{allTypes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CoaSeedButton />
          <Button asChild>
            <Link href="/chart-of-accounts/new">
              <Plus className="mr-2 h-4 w-4" /> New Account
            </Link>
          </Button>
        </div>
      </div>

      {allTypes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Sparkles className="h-10 w-10 text-muted-foreground/40" />
            <div className="text-center space-y-1">
              <p className="font-medium">No accounts yet</p>
              <p className="text-sm text-muted-foreground">Seed the standard chart of accounts or add one manually.</p>
            </div>
            <div className="flex items-center gap-2">
              <CoaSeedButton />
              <Button asChild variant="outline">
                <Link href="/chart-of-accounts/new">Add manually</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {allTypes.map((type) => (
        <Card key={type}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[type] ?? "bg-gray-100 text-gray-800"}`}
              >
                {type}
              </span>
              <span className="text-muted-foreground font-normal text-sm">
                {grouped[type].length} account{grouped[type].length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Category Match</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Sub-accounts</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped[type].map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {account.accountCode ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {account.parent && (
                        <span className="text-muted-foreground mr-1">↳</span>
                      )}
                      {account.accountName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.categoryMatch ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.parent?.accountName ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {account.children.length > 0 ? (
                        <Badge variant="secondary">{account.children.length}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/chart-of-accounts/${account.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <CoaDeleteButton
                          id={account.id}
                          name={account.accountName}
                          hasChildren={account.children.length > 0}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
