import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function JournalEntriesPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const entries = await prisma.journalEntry.findMany({
    where: { organizationId: session.user.organizationId },
    include: { lines: true },
    orderBy: { entryDate: "desc" },
    take: 100,
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Journal Entries</h2>
          <p className="text-muted-foreground">Manual double-entry bookkeeping</p>
        </div>
        <Button asChild>
          <Link href="/journal-entries/new">
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead className="text-right">Total Debit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0)
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.entryDate.toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-xs">{entry.reference || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status === "POSTED" ? "default" : "secondary"}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.lines.length}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                )
              })}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No journal entries yet. Create your first entry.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
