"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { RefreshCw, Plus, ArrowLeftRight, Loader2, Globe } from "lucide-react"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD", "SEK", "NOK", "DKK", "SGD", "HKD", "INR", "BRL", "MXN"]

export default function FxRatesClient() {
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [revaluing, setRevaluing] = useState(false)
  const [addDialog, setAddDialog] = useState(false)
  const [form, setForm] = useState({ fromCurrency: "EUR", toCurrency: "USD", rate: "", rateDate: new Date().toISOString().slice(0, 10) })
  const [adding, setAdding] = useState(false)
  const [liveCheck, setLiveCheck] = useState<{ rate: number; source: string } | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/fx/rates")
      if (res.ok) setRates(await res.json())
    } catch { toast.error("Failed to load FX rates") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRates() }, [fetchRates])

  const handleFetchLive = async () => {
    if (!form.fromCurrency || !form.toCurrency) return
    setLiveLoading(true)
    try {
      const res = await fetch(`/api/fx/rates?from=${form.fromCurrency}&to=${form.toCurrency}`)
      const data = await res.json()
      if (res.ok) {
        setLiveCheck({ rate: data.rate, source: data.source })
        setForm({ ...form, rate: data.rate.toString() })
      }
    } catch { toast.error("Failed to fetch live rate") }
    finally { setLiveLoading(false) }
  }

  const handleAdd = async () => {
    setAdding(true)
    try {
      const res = await fetch("/api/fx/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Exchange rate saved")
      setAddDialog(false)
      setLiveCheck(null)
      fetchRates()
    } catch (err: any) { toast.error(err.message) }
    finally { setAdding(false) }
  }

  const handleRevalue = async () => {
    setRevaluing(true)
    try {
      const res = await fetch("/api/fx/revalue", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Revaluation complete — ${data.invoicesRevalued} invoices, ${data.expensesRevalued} expenses updated${data.jeId ? ", JE posted" : ""}`)
    } catch (err: any) { toast.error(err.message) }
    finally { setRevaluing(false) }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Globe className="h-6 w-6" /> FX Rates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live exchange rates via Frankfurter (ECB) or OpenExchangeRates. Rates are cached daily per currency pair.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRevalue} disabled={revaluing}>
            {revaluing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowLeftRight className="h-4 w-4 mr-2" />}
            Run Revaluation
          </Button>
          <Button variant="outline" size="sm" onClick={fetchRates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => { setLiveCheck(null); setAddDialog(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Add Rate
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exchange Rate Register</CardTitle>
          <CardDescription>All cached exchange rates for your organisation. Rates are fetched live when not yet in the cache for today.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : rates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No exchange rates cached. Add a manual rate or create a foreign-currency invoice to auto-fetch.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><Badge variant="outline">{r.fromCurrency}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{r.toCurrency}</Badge></TableCell>
                    <TableCell className="text-right font-mono">{r.rate.toFixed(6)}</TableCell>
                    <TableCell>
                      <Badge variant={r.source === "MANUAL" ? "secondary" : "outline"} className="text-xs">{r.source}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(r.rateDate), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add / Override Exchange Rate</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">From Currency</label>
                <select
                  value={form.fromCurrency}
                  onChange={(e) => setForm({ ...form, fromCurrency: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">To Currency</label>
                <select
                  value={form.toCurrency}
                  onChange={(e) => setForm({ ...form, toCurrency: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">Rate</label>
                <Input type="number" step="0.000001" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="e.g. 1.085" />
              </div>
              <Button variant="outline" size="sm" onClick={handleFetchLive} disabled={liveLoading} className="mb-0.5">
                {liveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch Live"}
              </Button>
            </div>
            {liveCheck && (
              <p className="text-xs text-muted-foreground">
                Live rate: <strong>{liveCheck.rate.toFixed(6)}</strong> (source: {liveCheck.source})
              </p>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Rate Date</label>
              <Input type="date" value={form.rateDate} onChange={(e) => setForm({ ...form, rateDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={adding || !form.rate}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
