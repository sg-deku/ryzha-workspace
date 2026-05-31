"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { CheckCircle2, XCircle, ArrowRight, RefreshCw, AlertTriangle, Loader2, ClipboardCheck } from "lucide-react"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

const STATUS_VARIANT: Record<string, "secondary" | "outline" | "destructive" | "default"> = {
  PENDING: "outline",
  APPROVED: "secondary",
  REJECTED: "destructive",
  DELEGATED: "outline",
  ESCALATED: "default",
  EXPIRED: "outline",
}

function statusLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}

export default function ApprovalsClient() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("pending")
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: "approve" | "reject" | "delegate"
    requestId: string
    description: string
  }>({ open: false, type: "approve", requestId: "", description: "" })
  const [note, setNote] = useState("")
  const [delegateTo, setDelegateTo] = useState("")
  const [delegateToName, setDelegateToName] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [escalating, setEscalating] = useState(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/approvals")
      if (res.ok) setRequests(await res.json())
    } catch {
      toast.error("Failed to load approvals")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const filtered = requests.filter((r) => {
    if (tab === "pending") return r.status === "PENDING" || r.status === "ESCALATED"
    if (tab === "completed") return r.status === "APPROVED" || r.status === "REJECTED"
    if (tab === "delegated") return r.status === "DELEGATED"
    return true
  })

  const openAction = (type: "approve" | "reject" | "delegate", req: any) => {
    setNote("")
    setDelegateTo("")
    setDelegateToName("")
    setActionDialog({ open: true, type, requestId: req.id, description: req.description ?? req.entityType })
  }

  const handleAction = async () => {
    setActionLoading(true)
    try {
      let url = `/api/approvals/${actionDialog.requestId}/${actionDialog.type}`
      let body: any = { note }
      if (actionDialog.type === "delegate") {
        if (!delegateTo || !delegateToName) {
          toast.error("Delegate user ID and name are required")
          return
        }
        body = { delegateToId: delegateTo, delegateToName, note }
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Request ${actionDialog.type === "approve" ? "approved" : actionDialog.type === "reject" ? "rejected" : "delegated"} successfully`)
      setActionDialog({ ...actionDialog, open: false })
      fetchRequests()
    } catch (err: any) {
      toast.error(err.message || "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const handleEscalate = async () => {
    setEscalating(true)
    try {
      const res = await fetch("/api/approvals/escalate", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Escalated ${data.escalated} overdue request(s)`)
      fetchRequests()
    } catch (err: any) {
      toast.error(err.message || "Escalation failed")
    } finally {
      setEscalating(false)
    }
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING" || r.status === "ESCALATED").length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Approvals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review, approve, reject, or delegate pending purchase order and expense approval requests.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEscalate} disabled={escalating}>
            {escalating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
            Run Escalation
          </Button>
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-500">{pendingCount}</div>
            <div className="text-sm text-muted-foreground mt-1">Pending Approvals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-500">
              {requests.filter((r) => r.status === "APPROVED").length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-500">
              {requests.filter((r) => r.status === "REJECTED").length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Rejected</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Inbox</CardTitle>
          <CardDescription>All approval requests for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending {pendingCount > 0 && <Badge className="ml-2" variant="destructive">{pendingCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="delegated">Delegated</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No {tab !== "all" ? tab : ""} approval requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Approver</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      {tab === "pending" || tab === "all" ? <TableHead>Actions</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <Badge variant="outline">{req.entityType === "PurchaseOrder" ? "PO" : "Expense"}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{req.description ?? "—"}</TableCell>
                        <TableCell>
                          {req.amount != null ? `$${Number(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                        </TableCell>
                        <TableCell>{req.approverName}</TableCell>
                        <TableCell>
                          {req.dueDate ? (
                            <span className={new Date(req.dueDate) < new Date() && req.status === "PENDING" ? "text-red-500 font-medium" : ""}>
                              {format(new Date(req.dueDate), "MMM d, yyyy")}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[req.status] ?? "outline"}>
                            {statusLabel(req.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {format(new Date(req.requestedAt), "MMM d, yyyy")}
                        </TableCell>
                        {(tab === "pending" || tab === "all") && (
                          <TableCell>
                            {(req.status === "PENDING" || req.status === "ESCALATED") ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => openAction("approve", req)}>
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => openAction("reject", req)}>
                                  <XCircle className="h-3 w-3 mr-1" /> Reject
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => openAction("delegate", req)}>
                                  <ArrowRight className="h-3 w-3 mr-1" /> Delegate
                                </Button>
                              </div>
                            ) : null}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={actionDialog.open} onOpenChange={(o) => setActionDialog({ ...actionDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" ? "Approve Request" : actionDialog.type === "reject" ? "Reject Request" : "Delegate Request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{actionDialog.description}</p>
            {actionDialog.type === "delegate" && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Delegate To (User ID)</label>
                  <Input value={delegateTo} onChange={(e) => setDelegateTo(e.target.value)} placeholder="User ID" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Delegate To (Name)</label>
                  <Input value={delegateToName} onChange={(e) => setDelegateToName(e.target.value)} placeholder="Name" />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Note {actionDialog.type === "reject" ? "(required)" : "(optional)"}</label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={actionDialog.type === "reject" ? "Reason for rejection..." : "Optional note..."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ ...actionDialog, open: false })}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading || (actionDialog.type === "reject" && !note.trim())}
              variant={actionDialog.type === "reject" ? "destructive" : "default"}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {actionDialog.type === "approve" ? "Approve" : actionDialog.type === "reject" ? "Reject" : "Delegate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
