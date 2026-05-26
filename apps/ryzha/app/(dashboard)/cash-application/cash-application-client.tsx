"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, CheckCircle2, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function CashApplicationClient({ unmatched: initialUnmatched, openInvoices }: { unmatched: any[], openInvoices: any[] }) {
  const [unmatched, setUnmatched] = useState(initialUnmatched)
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const runMatcher = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cash-application/match", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setMatches(data.matches || [])
        toast.success(`Found ${data.matches?.length || 0} matches`)
      } else {
        toast.error("Failed to run matcher")
      }
    } catch (e) {
      toast.error("Error running AI matcher")
    } finally {
      setLoading(false)
    }
  }

  const approveMatch = async (transaction: any, match: any) => {
    setApprovingId(transaction.id)
    try {
      const res = await fetch(`/api/invoices/${match.invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: transaction.amount,
          paymentDate: new Date(transaction.date).toISOString().slice(0, 10),
          method: "bank_transfer",
          referenceNumber: transaction.reference,
          notes: transaction.description
        })
      })

      if (res.ok) {
        toast.success("Match approved and payment recorded")
        setUnmatched((prev) => prev.filter(u => u.id !== transaction.id))
        setMatches((prev) => prev.filter(m => m.transactionId !== transaction.id))
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to approve match")
      }
    } catch (e) {
      toast.error("Error approving match")
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cash Application</h2>
        <Button variant="outline" className="gap-2" onClick={runMatcher} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <Brain className="h-4 w-4 text-primary" />}
          Run AI Matcher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unapplied Payments</CardTitle>
          <CardDescription>Match incoming payments to outstanding sales orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Customer (Detected)</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Match Confidence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unmatched.map((payment) => {
                const match = matches.find(m => m.transactionId === payment.id)
                const confidence = match ? match.confidence : 0
                const customer = match ? match.customer : "Unknown"
                
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell className="font-medium">{customer}</TableCell>
                    <TableCell>${Number(payment.amount).toLocaleString()}</TableCell>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {match ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${confidence > 0.8 ? "bg-green-500" : confidence > 0.5 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${Math.min(confidence * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{(confidence * 100).toFixed(0)}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unmatched</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Search className="h-3 w-3" /> Manual Match
                        </Button>
                        {match && (
                          <Button size="sm" className="gap-1" onClick={() => approveMatch(payment, match)} disabled={approvingId === payment.id}>
                            {approvingId === payment.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Approve Match
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {unmatched.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No unapplied payments
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
