"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

interface TenantActionsProps {
  orgId: string
  currentStatus: string
}

export function TenantActions({ orgId, currentStatus }: TenantActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteAll, setDeleteAll] = useState(true)
  const [modules, setModules] = useState({
    financial: false,
    users: false,
    settings: false,
    logs: false
  })
  const [isDeleting, setIsDeleting] = useState(false)

  async function updateStatus(status: string) {
    await fetch(`/api/tenants/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await fetch(`/api/tenants/${orgId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleteAll,
          modules: deleteAll ? undefined : modules
        }),
      })
      setOpen(false)
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {currentStatus !== "SUSPENDED" && (
        <Button size="sm" variant="outline" onClick={() => updateStatus("SUSPENDED")}>
          Suspend
        </Button>
      )}
      {currentStatus === "SUSPENDED" && (
        <Button size="sm" variant="outline" onClick={() => updateStatus("ACTIVE")}>
          Unsuspend
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive">
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="deleteAll" 
                checked={deleteAll} 
                onCheckedChange={(c: boolean | 'indeterminate') => setDeleteAll(c === true)} 
              />
              <Label htmlFor="deleteAll" className="font-semibold text-destructive">
                Delete organization and all associated data
              </Label>
            </div>
            
            {!deleteAll && (
              <div className="pl-6 space-y-3">
                <p className="text-sm text-muted-foreground">Select individual modules to clear data for this organization (the organization itself will remain active):</p>
                <div className="flex items-center space-x-2">
                  <Checkbox id="financial" checked={modules.financial} onCheckedChange={(c: boolean | 'indeterminate') => setModules({...modules, financial: c === true})} />
                  <Label htmlFor="financial">Financial Data (Invoices, Expenses, Transactions, GL)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="users" checked={modules.users} onCheckedChange={(c: boolean | 'indeterminate') => setModules({...modules, users: c === true})} />
                  <Label htmlFor="users">Users & Roles</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="settings" checked={modules.settings} onCheckedChange={(c: boolean | 'indeterminate') => setModules({...modules, settings: c === true})} />
                  <Label htmlFor="settings">Settings (P2P, O2C, Financial)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="logs" checked={modules.logs} onCheckedChange={(c: boolean | 'indeterminate') => setModules({...modules, logs: c === true})} />
                  <Label htmlFor="logs">Logs & Webhooks</Label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Processing..." : deleteAll ? "Delete All" : "Clear Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}