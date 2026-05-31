"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Plus, RefreshCw, Upload, BarChart2, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"

export const dynamic = "force-dynamic"

const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD", "SEK", "NOK", "DKK"]

function VarianceBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-muted-foreground">—</span>
  const positive = pct >= 0
  return (
    <span className={`flex items-center gap-1 font-medium ${positive ? "text-green-600" : "text-red-600"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function fmt(n: number, currency = "USD") {
  return n.toLocaleString(undefined, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function BudgetsClient() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null)
  const [variance, setVariance] = useState<any[] | null>(null)
  const [varianceLoading, setVarianceLoading] = useState(false)
  const [createDialog, setCreateDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: "", fiscalYear: new Date().getFullYear().toString(), period: "MONTHLY", currency: "USD" })

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/budgets")
      if (res.ok) setBudgets(await res.json())
    } catch { toast.error("Failed to load budgets") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])

  const loadVariance = async (budget: any) => {
    setSelectedBudget(budget)
    setVariance(null)
    setVarianceLoading(true)
    try {
      const res = await fetch(`/api/budgets/${budget.id}/variance`)
      const data = await res.json()
      if (res.ok) setVariance(data.results)
      else toast.error(data.error)
    } catch { toast.error("Failed to load variance") }
    finally { setVarianceLoading(false) }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, fiscalYear: Number(form.fiscalYear), period: form.period, currency: form.currency }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Budget "${data.name}" created`)
      setCreateDialog(false)
      fetchBudgets()
    } catch (err: any) { toast.error(err.message) }
    finally { setCreating(false) }
  }

  const handleImport = async () => {
    if (!importFile || !selectedBudget) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append("file", importFile)
      fd.append("budgetId", selectedBudget.id)
      const res = await fetch("/api/budgets/import", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Imported ${data.imported} budget lines`)
      setImportDialog(false)
      setImportFile(null)
      loadVariance(selectedBudget)
    } catch (err: any) { toast.error(err.message) }
    finally { setImporting(false) }
  }

  const periods = variance ? [...new Set(variance.map((r: any) => r.periodLabel))].sort() : []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart2 className="h-6 w-6" /> Budget Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build account-level budgets, import from CSV, and track variance against actuals from the GL.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBudgets} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Budget
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Budgets</CardTitle>
            <CardDescription>{budgets.length} budget(s)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No budgets yet. Create one to get started.</p>
            ) : (
              <div className="divide-y">
                {budgets.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => loadVariance(b)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${selectedBudget?.id === b.id ? "bg-muted" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{b.name}</p>
                        <p className="text-xs text-muted-foreground">FY{b.fiscalYear} · {b.period} · {b.currency}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={b.status === "ACTIVE" ? "secondary" : "outline"} className="text-xs">{b.status}</Badge>
                        <span className="text-xs text-muted-foreground">{b._count?.lines ?? 0} lines</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedBudget ? `${selectedBudget.name} — Variance` : "Select a budget"}
                </CardTitle>
                {selectedBudget && (
                  <CardDescription>Budget vs GL actuals by account and period</CardDescription>
                )}
              </div>
              {selectedBudget && (
                <Button size="sm" variant="outline" onClick={() => setImportDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" /> Import CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedBudget ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Select a budget from the list to view variance.</p>
            ) : varianceLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : variance && variance.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No budget lines. Import a CSV to populate.</p>
            ) : variance ? (
              <Tabs defaultValue={periods[0]} key={selectedBudget.id}>
                <TabsList className="flex-wrap h-auto gap-1">
                  {periods.map((p) => <TabsTrigger key={p} value={p} className="text-xs">{p}</TabsTrigger>)}
                </TabsList>
                {periods.map((period) => {
                  const rows = variance.filter((r) => r.periodLabel === period)
                  const totalBudgeted = rows.reduce((s, r) => s + r.budgeted, 0)
                  const totalActual = rows.reduce((s, r) => s + r.actual, 0)
                  const totalVariance = totalBudgeted - totalActual
                  return (
                    <TabsContent key={period} value={period}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Budgeted</TableHead>
                            <TableHead className="text-right">Actual</TableHead>
                            <TableHead className="text-right">Variance</TableHead>
                            <TableHead className="text-right">Var %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{row.accountName}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{row.accountType}</Badge></TableCell>
                              <TableCell className="text-right">{fmt(row.budgeted, selectedBudget.currency)}</TableCell>
                              <TableCell className="text-right">{fmt(row.actual, selectedBudget.currency)}</TableCell>
                              <TableCell className={`text-right font-medium ${row.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {fmt(row.variance, selectedBudget.currency)}
                              </TableCell>
                              <TableCell className="text-right">
                                <VarianceBadge pct={row.variancePct} />
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2 font-semibold bg-muted/30">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell className="text-right">{fmt(totalBudgeted, selectedBudget.currency)}</TableCell>
                            <TableCell className="text-right">{fmt(totalActual, selectedBudget.currency)}</TableCell>
                            <TableCell className={`text-right ${totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {fmt(totalVariance, selectedBudget.currency)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TabsContent>
                  )
                })}
              </Tabs>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Budget Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. FY2026 Operating Budget" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Fiscal Year</label>
                <Input type="number" value={form.fiscalYear} onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Period</label>
                <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Currency</label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !form.name}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import Budget Lines from CSV</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              CSV must have columns: <strong>Account Name</strong>, <strong>Account Type</strong>, <strong>Period</strong> (e.g. 2026-01), <strong>Budgeted</strong>.
            </p>
            <Input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">
              Importing will replace all existing lines for this budget.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialog(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
