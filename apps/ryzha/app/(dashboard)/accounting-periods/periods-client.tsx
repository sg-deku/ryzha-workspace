"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Lock, LockOpen, RefreshCw, CalendarDays, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_CONFIG: Record<string, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  OPEN: { label: "Open", variant: "secondary" },
  SOFT_CLOSE: { label: "Soft Closed", variant: "outline" },
  HARD_CLOSE: { label: "Hard Closed", variant: "destructive" },
}

export default function AccountingPeriodsClient() {
  const [periods, setPeriods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString())
  const [checklistDialog, setChecklistDialog] = useState<{ open: boolean; periodId: string; periodName: string; items: any[] }>({ open: false, periodId: "", periodName: "", items: [] })
  const [checklistLoading, setChecklistLoading] = useState(false)
  const [closeDialog, setCloseDialog] = useState<{ open: boolean; periodId: string; periodName: string; type: "SOFT_CLOSE" | "HARD_CLOSE" }>({ open: false, periodId: "", periodName: "", type: "SOFT_CLOSE" })
  const [closeLoading, setCloseLoading] = useState(false)

  const fetchPeriods = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/accounting-periods")
      if (res.ok) setPeriods(await res.json())
    } catch {
      toast.error("Failed to load accounting periods")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPeriods() }, [fetchPeriods])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/accounting-periods/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiscalYear: parseInt(fiscalYear) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Generated ${data.length} periods for FY${fiscalYear}`)
      fetchPeriods()
    } catch (err: any) {
      toast.error(err.message || "Failed to generate periods")
    } finally {
      setGenerating(false)
    }
  }

  const openChecklist = async (periodId: string, periodName: string) => {
    setChecklistLoading(true)
    setChecklistDialog({ open: true, periodId, periodName, items: [] })
    try {
      const res = await fetch(`/api/accounting-periods/${periodId}/checklist`)
      if (res.ok) {
        const items = await res.json()
        setChecklistDialog(prev => ({ ...prev, items }))
      }
    } catch {
      toast.error("Failed to load checklist")
    } finally {
      setChecklistLoading(false)
    }
  }

  const handleClose = async () => {
    setCloseLoading(true)
    try {
      const res = await fetch(`/api/accounting-periods/${closeDialog.periodId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: closeDialog.type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Period "${closeDialog.periodName}" ${closeDialog.type === "HARD_CLOSE" ? "hard" : "soft"} closed`)
      setCloseDialog(prev => ({ ...prev, open: false }))
      fetchPeriods()
    } catch (err: any) {
      toast.error(err.message || "Failed to close period")
    } finally {
      setCloseLoading(false)
    }
  }

  const handleReopen = async (periodId: string, periodName: string) => {
    if (!confirm(`Reopen period "${periodName}"? This allows posting into this period again.`)) return
    try {
      const res = await fetch(`/api/accounting-periods/${periodId}/reopen`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Period "${periodName}" reopened`)
      fetchPeriods()
    } catch (err: any) {
      toast.error(err.message || "Failed to reopen period")
    }
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() + 1 - i).toString())

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting Periods</h1>
          <p className="text-muted-foreground">Manage fiscal period lifecycle — open, soft-close, and hard-close periods to control posting.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={fiscalYear} onValueChange={setFiscalYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => <SelectItem key={y} value={y}>FY {y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarDays className="mr-2 h-4 w-4" />}
            Generate Periods
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Period Register</CardTitle>
          <CardDescription>All fiscal periods across years. Hard-closed periods block all journal entry postings.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Period</TableHead>
                <TableHead>Fiscal Year</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Closed By</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                    No periods found. Generate periods for a fiscal year to get started.
                  </TableCell>
                </TableRow>
              ) : periods.map(p => {
                const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.OPEN
                return (
                  <TableRow key={p.id}>
                    <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                    <TableCell>{p.fiscalYear}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(p.startDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(p.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.closedBy ?? "—"}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openChecklist(p.id, p.name)}>
                          Checklist
                        </Button>
                        {p.status === "OPEN" && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setCloseDialog({ open: true, periodId: p.id, periodName: p.name, type: "SOFT_CLOSE" })}>
                              <Lock className="h-3 w-3 mr-1" />
                              Soft Close
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCloseDialog({ open: true, periodId: p.id, periodName: p.name, type: "HARD_CLOSE" })}>
                              <Lock className="h-3 w-3 mr-1" />
                              Hard Close
                            </Button>
                          </>
                        )}
                        {p.status === "SOFT_CLOSE" && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setCloseDialog({ open: true, periodId: p.id, periodName: p.name, type: "HARD_CLOSE" })}>
                              <Lock className="h-3 w-3 mr-1" />
                              Hard Close
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleReopen(p.id, p.name)}>
                              <LockOpen className="h-3 w-3 mr-1" />
                              Reopen
                            </Button>
                          </>
                        )}
                        {p.status === "HARD_CLOSE" && (
                          <Button variant="ghost" size="sm" onClick={() => handleReopen(p.id, p.name)}>
                            <LockOpen className="h-3 w-3 mr-1" />
                            Reopen
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={checklistDialog.open} onOpenChange={open => setChecklistDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pre-Close Checklist — {checklistDialog.periodName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {checklistLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : checklistDialog.items.map(item => (
              <div key={item.key} className="flex items-start gap-3 p-3 rounded-lg border">
                {item.pass ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : item.key === "draft_jes" || item.key === "unposted_depreciation" ? (
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  {!item.pass && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.count} {item.count === 1 ? "item" : "items"} outstanding
                      {(item.key === "draft_jes" || item.key === "unposted_depreciation") && " — must resolve before hard close"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChecklistDialog(prev => ({ ...prev, open: false }))}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialog.open} onOpenChange={open => setCloseDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{closeDialog.type === "HARD_CLOSE" ? "Hard Close" : "Soft Close"} — {closeDialog.periodName}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {closeDialog.type === "HARD_CLOSE" ? (
              <p className="text-sm text-muted-foreground">
                Hard closing this period will permanently block all journal entry postings to any date within it. Any outstanding draft JEs and unposted depreciation must be resolved first. This action can be reversed but requires administrator approval.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Soft closing this period will warn users attempting to post to it. Administrators can still post with an explicit override. This is a reversible action.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button variant={closeDialog.type === "HARD_CLOSE" ? "destructive" : "default"} onClick={handleClose} disabled={closeLoading}>
              {closeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {closeDialog.type === "HARD_CLOSE" ? "Hard Close Period" : "Soft Close Period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
