import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { DataPagination } from "@/components/ui/data-pagination"
import { Suspense } from "react"
import { JournalEntryActions } from "./journal-entry-actions"
import { PageShell } from "@/components/ui/page-shell"

const PAGE_SIZE = 50

export const dynamic = "force-dynamic"

function getSourceLink(sourceType: string | null, sourceId: string | null): string | null {
  if (!sourceType || !sourceId) return null
  switch (sourceType) {
    case "Invoice": return `/invoices/${sourceId}`
    case "Expense": return `/expenses/${sourceId}`
    case "VendorInvoice": return `/vendor-invoices/${sourceId}`
    case "CreditNote": return null
    case "VendorDebitMemo": return `/vendor-debit-memos`
    case "StripePayment": return `/transactions`
    case "StripePayout": return `/transactions`
    case "Refund": return `/transactions`
    case "DeferredRelease": return null
    case "VendorPayment": return null
    default: return null
  }
}

const TYPE_COLORS: Record<string, string> = {
  REGULAR: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  ADJUSTING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  CLOSING: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  REVERSING: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  POSTED: "default",
  DRAFT: "secondary",
  REVERSED: "outline",
}

export default async function JournalEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; type?: string; origin?: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const { page, status, type, origin } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)

  const where = {
    organizationId: session.user.organizationId,
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(origin === "manual" ? { isSystem: false } : origin === "system" ? { isSystem: true } : {}),
  }

  const [entries, total, counts] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      include: { lines: true },
      orderBy: { entryDate: "desc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.journalEntry.count({ where }),
    prisma.journalEntry.groupBy({
      by: ["status"],
      where: { organizationId: session.user.organizationId },
      _count: true,
    }),
  ])

  const postedCount = counts.find((c) => c.status === "POSTED")?._count ?? 0
  const draftCount = counts.find((c) => c.status === "DRAFT")?._count ?? 0

  return (
    <PageShell
      title="Journal Entries"
      subtitle="Double-entry bookkeeping — all entries post directly to the General Ledger."
      newHref="/journal-entries/new"
      newLabel="New Entry"
      actions={[
        { label: "Trial Balance", href: "/trial-balance", variant: "outline", icon: <TrendingUp className="h-4 w-4" /> },
      ]}
      kpis={[
        { label: "Total Entries", value: postedCount + draftCount },
        { label: "Posted to GL", value: postedCount },
        { label: "Drafts", value: draftCount },
      ]}
    >

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>All Entries</CardTitle>
          <div className="flex gap-2 text-sm flex-wrap justify-end">
            <Link href="/journal-entries" className={!status && !type && !origin ? "font-semibold underline" : "text-muted-foreground hover:text-foreground"}>All</Link>
            <Link href="/journal-entries?status=DRAFT" className={status === "DRAFT" ? "font-semibold underline" : "text-muted-foreground hover:text-foreground"}>Drafts</Link>
            <Link href="/journal-entries?status=POSTED" className={status === "POSTED" ? "font-semibold underline" : "text-muted-foreground hover:text-foreground"}>Posted</Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/journal-entries?origin=manual" className={origin === "manual" ? "font-semibold underline" : "text-muted-foreground hover:text-foreground"}>Manual</Link>
            <Link href="/journal-entries?origin=system" className={origin === "system" ? "font-semibold underline" : "text-muted-foreground hover:text-foreground"}>System</Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/journal-entries?type=ADJUSTING" className={type === "ADJUSTING" ? "font-semibold underline" : "text-muted-foreground hover:text-foreground"}>Adjusting</Link>
            <Link href="/journal-entries?type=CLOSING" className={type === "CLOSING" ? "font-semibold underline" : "text-muted-foreground hover:text-foreground"}>Closing</Link>
            <Link href="/journal-entries?type=REVERSING" className={type === "REVERSING" ? "font-semibold underline" : "text-muted-foreground hover:text-foreground"}>Reversing</Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>External ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Lines</TableHead>
                <TableHead className="text-right">Debit Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0)
                const sourceLink = getSourceLink(entry.sourceType, entry.sourceId)
                return (
                  <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/40">
                    <TableCell className="whitespace-nowrap text-sm">
                      <Link href={`/journal-entries/${entry.id}`} className="block">
                        {entry.entryDate.toLocaleDateString()}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/journal-entries/${entry.id}`} className="block hover:underline text-primary">
                        {entry.reference || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{entry.description}</TableCell>
                    <TableCell className="text-xs">
                      {entry.sourceType ? (
                        <div className="flex items-center gap-1.5">
                          {entry.isSystem && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              AUTO
                            </span>
                          )}
                          {sourceLink ? (
                            <Link href={sourceLink} className="text-primary underline underline-offset-2 hover:no-underline">
                              {entry.sourceType}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">{entry.sourceType}</span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                          MANUAL
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[entry.type] ?? "bg-gray-100 text-gray-700"}`}>
                        {entry.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.period || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[entry.status] ?? "outline"}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">{entry.lines.length}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <JournalEntryActions entry={entry} />
                    </TableCell>
                  </TableRow>
                )
              })}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    No journal entries found. <Link href="/journal-entries/new" className="underline">Create your first entry</Link>.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Suspense>
            <DataPagination total={total} pageSize={PAGE_SIZE} currentPage={currentPage} />
          </Suspense>
        </CardContent>
      </Card>
    </PageShell>
  )
}
