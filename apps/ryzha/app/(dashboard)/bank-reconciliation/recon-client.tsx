"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Sparkles, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react"

interface ReconciliationMatch {
  bankTransactionId: string
  matchType: "vendor_payment" | "invoice_payment" | "unmatched"
  matchedId: string | null
  confidence: number
  reasoning: string
  amountVariance: number
  suggestedAction: "auto_confirm" | "review" | "ignore"
}

interface ImportResult {
  imported: number
  skipped: number
  total: number
}

interface MatchResult {
  total: number
  autoConfirmed: number
  matches: ReconciliationMatch[]
}

export function BankReconClient() {
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [pendingMatches, setPendingMatches] = useState<ReconciliationMatch[]>([])
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())
  const [importLoading, setImportLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [closingBalance, setClosingBalance] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setImportLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      if (closingBalance) fd.append("closingBalance", closingBalance)
      const res = await fetch("/api/bank-reconciliation/import", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Import failed")
      setImportResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImportLoading(false)
      e.target.value = ""
    }
  }

  async function handleRunAI() {
    setError(null)
    setMatchLoading(true)
    try {
      const res = await fetch("/api/bank-reconciliation/match", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "AI matching failed")
      setMatchResult(data)
      setPendingMatches(data.matches.filter((m: ReconciliationMatch) => m.suggestedAction === "review"))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setMatchLoading(false)
    }
  }

  async function handleConfirm(match: ReconciliationMatch) {
    if (!match.matchedId) return
    setConfirmingId(match.bankTransactionId)
    try {
      const res = await fetch("/api/bank-reconciliation/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankTransactionId: match.bankTransactionId,
          matchType: match.matchType,
          matchedId: match.matchedId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Confirm failed")
      }
      setConfirmedIds(prev => new Set(prev).add(match.bankTransactionId))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirmingId(null)
    }
  }

  const confidenceBadge = (confidence: number) => {
    const pct = Math.round(confidence * 100)
    if (pct >= 90) return <Badge className="bg-green-100 text-green-800 border border-green-300">{pct}% High</Badge>
    if (pct >= 60) return <Badge className="bg-amber-100 text-amber-800 border border-amber-300">{pct}% Medium</Badge>
    return <Badge className="bg-red-100 text-red-800 border border-red-300">{pct}% Low</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Bank Statement
          </CardTitle>
          <CardDescription>Upload a CSV bank statement. Ryzha auto-detects column headers (Date, Description, Amount, Reference, Balance).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Closing Balance (optional)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 125000.00"
                value={closingBalance}
                onChange={e => setClosingBalance(e.target.value)}
                className="flex h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              />
            </div>
            <label className="cursor-pointer">
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importLoading} />
              <Button variant="outline" disabled={importLoading} asChild>
                <span>
                  {importLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Choose CSV File
                </span>
              </Button>
            </label>
          </div>

          {importResult && (
            <div className="flex items-center gap-3 text-sm rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Imported <strong>{importResult.imported}</strong> transactions · Skipped <strong>{importResult.skipped}</strong> duplicates</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI Reconciliation
          </CardTitle>
          <CardDescription>
            Ryzha AI matches unmatched bank debits to vendor payments and credits to customer invoice payments using amount, date, and description signals.
            High-confidence matches are auto-confirmed. Medium-confidence matches are presented for review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleRunAI} disabled={matchLoading} className="gap-2">
            {matchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Run AI Matching
          </Button>

          {matchResult && (
            <div className="flex items-center gap-6 text-sm rounded-md border px-4 py-2.5 bg-muted/40">
              <span><strong>{matchResult.total}</strong> candidates found</span>
              <span className="text-green-700 dark:text-green-400"><strong>{matchResult.autoConfirmed}</strong> auto-confirmed</span>
              <span className="text-amber-700 dark:text-amber-400"><strong>{pendingMatches.length}</strong> awaiting review</span>
            </div>
          )}
        </CardContent>
      </Card>

      {pendingMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Matches Awaiting Review
            </CardTitle>
            <CardDescription>These matches require your confirmation before being recorded.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingMatches.map(match => {
                const confirmed = confirmedIds.has(match.bankTransactionId)
                return (
                  <div
                    key={match.bankTransactionId}
                    className={`flex items-start gap-4 rounded-lg border px-4 py-3 ${
                      confirmed ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-background"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {confidenceBadge(match.confidence)}
                        <Badge variant="outline" className="text-xs">
                          {match.matchType === "vendor_payment" ? "P2P — Vendor Payment" : "O2C — Invoice Payment"}
                        </Badge>
                        {match.amountVariance !== 0 && (
                          <span className="text-xs text-amber-600">
                            Δ ${Math.abs(match.amountVariance).toFixed(2)} variance
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{match.reasoning}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {confirmed ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          Confirmed
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleConfirm(match)}
                            disabled={confirmingId === match.bankTransactionId}
                          >
                            {confirmingId === match.bankTransactionId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPendingMatches(prev => prev.filter(m => m.bankTransactionId !== match.bankTransactionId))}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-2.5 text-red-700 dark:text-red-400">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
