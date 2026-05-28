import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { JournalEntryActions } from "../journal-entry-actions"

export const dynamic = "force-dynamic"

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

function getSourceLink(sourceType: string | null, sourceId: string | null): string | null {
  if (!sourceType || !sourceId) return null
  switch (sourceType) {
    case "Invoice": return `/invoices/${sourceId}`
    case "Expense": return `/expenses/${sourceId}`
    case "VendorInvoice": return `/vendor-invoices/${sourceId}`
    case "StripePayment":
    case "StripePayout":
    case "Refund": return `/transactions`
    default: return null
  }
}

export default async function JournalEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const entry = await prisma.journalEntry.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { lines: true },
  })

  if (!entry) notFound()

  const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0)
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
  const sourceLink = getSourceLink(entry.sourceType, entry.sourceId)

  const reversalEntry = entry.reversedById
    ? await prisma.journalEntry.findUnique({ where: { id: entry.reversedById }, select: { id: true, reference: true } })
    : null

  const originalEntry = entry.reversalOf
    ? await prisma.journalEntry.findUnique({ where: { id: entry.reversalOf }, select: { id: true, reference: true } })
    : null

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/journal-entries"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {entry.reference || `JE-${entry.id.slice(-8)}`}
          </h2>
          <p className="text-sm text-muted-foreground">{entry.description}</p>
        </div>
        <JournalEntryActions entry={entry} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-semibold mt-0.5">{entry.entryDate.toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={STATUS_VARIANTS[entry.status] ?? "outline"} className="mt-1">{entry.status}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Type</p>
            <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[entry.type] ?? "bg-gray-100 text-gray-700"}`}>
              {entry.type}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Period</p>
            <p className="font-semibold mt-0.5">{entry.period || "—"}</p>
          </CardContent>
        </Card>
      </div>

      {(entry.sourceType || reversalEntry || originalEntry) && (
        <Card>
          <CardContent className="pt-4 pb-3 flex flex-wrap gap-6">
            {entry.sourceType && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Source</p>
                <div className="flex items-center gap-2">
                  {entry.isSystem && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">AUTO</span>
                  )}
                  {sourceLink ? (
                    <Link href={sourceLink} className="text-sm text-primary underline underline-offset-2 flex items-center gap-1">
                      {entry.sourceType} <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">{entry.sourceType}</span>
                  )}
                </div>
              </div>
            )}
            {originalEntry && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Reversal Of</p>
                <Link href={`/journal-entries/${originalEntry.id}`} className="text-sm text-primary underline underline-offset-2">
                  {originalEntry.reference || originalEntry.id.slice(-8)}
                </Link>
              </div>
            )}
            {reversalEntry && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Reversed By</p>
                <Link href={`/journal-entries/${reversalEntry.id}`} className="text-sm text-primary underline underline-offset-2">
                  {reversalEntry.reference || reversalEntry.id.slice(-8)}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Journal Entry Lines</CardTitle>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${isBalanced ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              <span className={`h-2 w-2 rounded-full ${isBalanced ? "bg-green-500" : "bg-destructive"}`} />
              {isBalanced ? "Balanced" : `Off by $${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                  <th className="text-left py-2.5 px-4 font-semibold">Account Type</th>
                  <th className="text-left py-2.5 px-4 font-semibold">Account Name</th>
                  <th className="text-left py-2.5 px-4 font-semibold">Description</th>
                  <th className="text-right py-2.5 px-4 font-semibold">Debit (DR)</th>
                  <th className="text-right py-2.5 px-4 font-semibold">Credit (CR)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entry.lines.map((line) => (
                  <tr key={line.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <span className="text-xs text-muted-foreground">{line.accountType}</span>
                    </td>
                    <td className="py-3 px-4 font-medium">{line.accountName}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs truncate">{line.description || "—"}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {line.debit > 0 ? (
                        <span className="text-green-700 dark:text-green-400 font-semibold">
                          ${line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {line.credit > 0 ? (
                        <span className="text-blue-700 dark:text-blue-400 font-semibold">
                          ${line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/30 font-semibold text-sm">
                  <td className="py-3 px-4" colSpan={3}>Total</td>
                  <td className="py-3 px-4 text-right font-mono text-green-700 dark:text-green-400">
                    ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700 dark:text-blue-400">
                    ${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
