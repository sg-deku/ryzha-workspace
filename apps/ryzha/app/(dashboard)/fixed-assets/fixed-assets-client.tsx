"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus, Play, Loader2, TrendingDown } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FULLY_DEPRECIATED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DISPOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

export default function FixedAssetsClient() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [runningDepr, setRunningDepr] = useState(false)
  const [disposeDialog, setDisposeDialog] = useState<{ open: boolean; assetId: string; assetName: string }>({ open: false, assetId: "", assetName: "" })
  const [disposeForm, setDisposeForm] = useState({ disposalDate: new Date().toISOString().split("T")[0], disposalProceeds: "0", disposalNotes: "" })
  const [disposing, setDisposing] = useState(false)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/fixed-assets")
      if (res.ok) setAssets(await res.json())
    } catch {
      toast.error("Failed to load fixed assets")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  const handleRunDepreciation = async () => {
    setRunningDepr(true)
    try {
      const res = await fetch("/api/fixed-assets/run-depreciation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: new Date().toISOString() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const { processed, errors } = data
      if (errors.length > 0) {
        toast.warning(`Depreciation run complete: ${processed.length} posted, ${errors.length} errors`)
      } else {
        toast.success(`Depreciation run complete: ${processed.length} entries posted`)
      }
      fetchAssets()
    } catch (err: any) {
      toast.error(err.message || "Failed to run depreciation")
    } finally {
      setRunningDepr(false)
    }
  }

  const handleDispose = async () => {
    setDisposing(true)
    try {
      const res = await fetch(`/api/fixed-assets/${disposeDialog.assetId}/dispose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disposalDate: disposeForm.disposalDate,
          disposalProceeds: parseFloat(disposeForm.disposalProceeds),
          disposalNotes: disposeForm.disposalNotes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const gain = data.gain ?? 0
      toast.success(`Asset disposed. ${gain >= 0 ? `Gain: $${gain.toFixed(2)}` : `Loss: $${Math.abs(gain).toFixed(2)}`}`)
      setDisposeDialog(prev => ({ ...prev, open: false }))
      fetchAssets()
    } catch (err: any) {
      toast.error(err.message || "Failed to dispose asset")
    } finally {
      setDisposing(false)
    }
  }

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fixed Assets</h1>
          <p className="text-muted-foreground">Track capital assets, depreciation schedules, and book values under GAAP / IFRS.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRunDepreciation} disabled={runningDepr}>
            {runningDepr ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Run Depreciation
          </Button>
          <Button asChild>
            <Link href="/fixed-assets/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Register</CardTitle>
          <CardDescription>All fixed assets and their current book values.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Asset #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Acquisition Cost</TableHead>
                <TableHead>Accumulated Depr.</TableHead>
                <TableHead>Book Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground italic">
                    No fixed assets recorded. Add your first asset to begin tracking depreciation.
                  </TableCell>
                </TableRow>
              ) : assets.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="pl-6 font-mono text-sm">{a.assetNumber}</TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{a.category}</TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline" className="font-mono text-xs">
                      {a.depreciationMethod === "DOUBLE_DECLINING" ? "DDB" : "SL"}
                    </Badge>
                  </TableCell>
                  <TableCell>{fmt(a.acquisitionCost)}</TableCell>
                  <TableCell className="text-muted-foreground">{fmt(a.accumulatedDepreciation)}</TableCell>
                  <TableCell className="font-medium">{fmt(a.currentBookValue)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status] ?? ""}`}>
                      {a.status === "ACTIVE" && <TrendingDown className="h-3 w-3" />}
                      {a.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/fixed-assets/${a.id}`}>View</Link>
                      </Button>
                      {a.status === "ACTIVE" && (
                        <Button variant="outline" size="sm" onClick={() => setDisposeDialog({ open: true, assetId: a.id, assetName: a.name })}>
                          Dispose
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={disposeDialog.open} onOpenChange={open => setDisposeDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispose Asset — {disposeDialog.assetName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will post a disposal journal entry (remove asset cost, remove accumulated depreciation, recognise gain/loss) and mark the asset as DISPOSED.
            </p>
            <div className="space-y-2">
              <Label>Disposal Date</Label>
              <Input type="date" value={disposeForm.disposalDate} onChange={e => setDisposeForm(p => ({ ...p, disposalDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Sale / Disposal Proceeds ($)</Label>
              <Input type="number" min="0" step="0.01" value={disposeForm.disposalProceeds} onChange={e => setDisposeForm(p => ({ ...p, disposalProceeds: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Optional disposal notes" value={disposeForm.disposalNotes} onChange={e => setDisposeForm(p => ({ ...p, disposalNotes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisposeDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button variant="destructive" onClick={handleDispose} disabled={disposing}>
              {disposing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dispose Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
