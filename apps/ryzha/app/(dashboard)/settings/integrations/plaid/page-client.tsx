"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Unplug, Loader2 } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function PlaidIntegrationClient() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/bank-feeds/accounts")
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.filter((a: any) => a.connectionType === "PLAID"))
      }
    } catch {
      toast.error("Failed to load Plaid accounts")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch("/api/bank-feeds/plaid/link-token", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.info("Plaid Link requires the Plaid.js SDK. See setup instructions below to install and configure it.")
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize Plaid Link")
    } finally {
      setConnecting(false)
    }
  }

  const handleSync = async (accountId: string) => {
    setSyncing(accountId)
    try {
      const res = await fetch(`/api/bank-feeds/accounts/${accountId}/sync`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Synced ${data.added} transactions (${data.skipped} skipped)`)
      fetchAccounts()
    } catch (err: any) {
      toast.error(err.message || "Sync failed")
    } finally {
      setSyncing(null)
    }
  }

  const handleDisconnect = async (accountId: string, name: string) => {
    if (!confirm(`Disconnect "${name}" from Plaid? Bank transactions will be retained but the auto-sync will stop.`)) return
    setDisconnecting(accountId)
    try {
      const res = await fetch(`/api/bank-feeds/accounts/${accountId}/disconnect`, { method: "POST" })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(`"${name}" disconnected from Plaid`)
      fetchAccounts()
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect")
    } finally {
      setDisconnecting(null)
    }
  }

  const plaidConnected = accounts.length > 0

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings/integrations"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plaid Connector</h1>
          <p className="text-muted-foreground">Connect US and Canadian bank accounts for automated transaction import.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center h-5 w-5 rounded bg-black">
                <span className="text-white font-bold text-[10px]">P</span>
              </div>
              Plaid
              {plaidConnected ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {accounts.length} account{accounts.length !== 1 ? "s" : ""} connected
                </Badge>
              ) : (
                <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Not connected</Badge>
              )}
            </CardTitle>
            <CardDescription>Automated bank feed sync for 12,000+ US and Canadian financial institutions.</CardDescription>
          </div>
          <Button onClick={handleConnect} disabled={connecting}>
            {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect Bank
          </Button>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/40 border text-sm space-y-2">
            <p className="font-medium">Setup instructions</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Create a <strong>Plaid account</strong> at <code>dashboard.plaid.com</code></li>
              <li>Add <code>PLAID_CLIENT_ID</code>, <code>PLAID_SECRET</code>, and <code>PLAID_ENV=sandbox</code> to your environment variables</li>
              <li>Install <code>react-plaid-link</code>: <code>pnpm add react-plaid-link</code></li>
              <li>Replace the "Connect Bank" button handler with a Plaid Link flow using the link token from <code>/api/bank-feeds/plaid/link-token</code></li>
              <li>On <code>onSuccess</code>, POST the <code>publicToken</code> to <code>/api/bank-feeds/plaid/exchange</code></li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>Bank accounts synced via Plaid. Click "Sync Now" to pull the latest transactions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Account</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Sync Status</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-16 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : accounts.map(acc => (
                  <TableRow key={acc.id}>
                    <TableCell className="pl-6 font-medium">{acc.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{acc.institutionName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={acc.syncStatus === "ERROR" ? "destructive" : acc.syncStatus === "SYNCING" ? "outline" : "secondary"} className="capitalize text-xs">
                        {acc.syncStatus === "SYNCING" && <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />}
                        {acc.syncStatus.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {acc.lastSyncedAt ? new Date(acc.lastSyncedAt).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleSync(acc.id)} disabled={syncing === acc.id || acc.syncStatus === "SYNCING"}>
                          {syncing === acc.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                          Sync Now
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleDisconnect(acc.id, acc.name)} disabled={disconnecting === acc.id}>
                          {disconnecting === acc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unplug className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
