"use client"

import * as React from "react"
import {
  X, ExternalLink, CheckCircle2, ArrowRight, Loader2, AlertCircle, ChevronRight, Copy, Check, RefreshCw, Unplug
} from "lucide-react"
import type { ProviderConfig } from "@/lib/providers"
import type { ConnectionStatus } from "@/components/connect/provider-grid"

interface Props {
  provider: ProviderConfig
  connection: { status: ConnectionStatus; lastSyncAt: Date | null } | null
  qbConfigured: boolean
  onClose: () => void
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

export function ConnectModal({ provider, connection, qbConfigured, onClose }: Props) {
  const [fields, setFields] = React.useState<Record<string, string>>({})
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)
  const [syncing, setSyncing] = React.useState(false)
  const [syncResult, setSyncResult] = React.useState<string | null>(null)
  const [disconnecting, setDisconnecting] = React.useState(false)
  const [showQBReconfigure, setShowQBReconfigure] = React.useState(false)

  async function handleSyncNow() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/connect/resync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id }),
      })
      const json = await res.json()
      if (res.ok) {
        setSyncResult("Sync complete")
      } else {
        setSyncResult(json.error ?? "Sync failed")
      }
    } catch {
      setSyncResult("Sync failed - check connection")
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    if (!window.confirm(`Disconnect ${provider.name}? This will stop all data syncing from this source.`)) return
    setDisconnecting(true)
    setError(null)
    try {
      const url = isQB
        ? "/api/connect/quickbooks/disconnect"
        : "/api/connect/disconnect"
      const body = isQB
        ? undefined
        : JSON.stringify({ provider: provider.id })
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to disconnect")
      onClose()
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDisconnecting(false)
    }
  }

  const isConnected = connection?.status === "ACTIVE"
  const isQB = provider.id === "QUICKBOOKS"
  const needsQBSetup = isQB && !qbConfigured && !isConnected

  const redirectUri = typeof window !== "undefined"
    ? `${window.location.origin}/api/connect/quickbooks/callback`
    : "http://localhost:3001/api/connect/quickbooks/callback"

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  async function handleQBConfigure(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/connect/quickbooks/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: fields.clientId, clientSecret: fields.clientSecret }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save")
      window.location.href = "/api/connect/quickbooks/auth"
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleApiKeySave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/connect/apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id, fields }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save")
      setSaved(true)
      setTimeout(() => { onClose(); window.location.reload() }, 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg bg-background rounded-2xl border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl ${provider.color} flex items-center justify-center shrink-0`}>
              <span className="text-white font-bold text-sm">{provider.logo}</span>
            </div>
            <div>
              <h2 className="font-semibold text-base">{provider.name}</h2>
              <p className="text-xs text-muted-foreground">{provider.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">{provider.description}</p>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              What gets synced
            </p>
            <ul className="space-y-1.5">
              {provider.syncPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* ── QuickBooks: needs app setup OR reconfiguring ── */}
          {isQB && (needsQBSetup || showQBReconfigure) && (
            <form onSubmit={handleQBConfigure} className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-semibold">Step 1 - Register a QuickBooks app</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Go to <a href="https://developer.intuit.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">developer.intuit.com</a> and create an app</li>
                  <li>Choose <strong>QuickBooks Online Accounting</strong> scope</li>
                  <li>Under <strong>Redirect URIs</strong>, add:</li>
                </ol>
                <div className="flex items-center gap-1 rounded border bg-background px-3 py-1.5 font-mono text-xs text-muted-foreground mt-1">
                  <span className="truncate">{redirectUri}</span>
                  <CopyButton value={redirectUri} />
                </div>
                <p className="text-xs text-muted-foreground">4. Copy your Client ID and Client Secret from the app's Keys & Credentials page.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Client ID</label>
                <input
                  type="text"
                  placeholder="AB1cDeFgHiJkLmNoPqRsTuVwXyZ..."
                  value={fields.clientId ?? ""}
                  onChange={(e) => setFields((p) => ({ ...p, clientId: e.target.value }))}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Client Secret</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••"
                  value={fields.clientSecret ?? ""}
                  onChange={(e) => setFields((p) => ({ ...p, clientSecret: e.target.value }))}
                  required
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
                  : <>Save & Connect to QuickBooks <ArrowRight className="h-4 w-4" /></>}
              </button>
              {showQBReconfigure && (
                <button
                  type="button"
                  onClick={() => { setShowQBReconfigure(false); setError(null) }}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              )}
            </form>
          )}

          {/* ── QuickBooks: app configured, not yet connected ── */}
          {isQB && !needsQBSetup && !showQBReconfigure && !isConnected && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/50 border px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                {provider.oauthNote}
              </div>
              <a
                href="/api/connect/quickbooks/auth"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 hover:bg-primary/90 transition-colors"
              >
                Connect QuickBooks Online <ArrowRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setShowQBReconfigure(true)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Wrong credentials? Re-enter them →
              </button>
            </div>
          )}

          {/* ── QuickBooks: already connected ── */}
          {isQB && isConnected && (
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Connected</p>
                  {connection?.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      Last synced {new Date(connection.lastSyncAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncing}
                className="flex items-center justify-center gap-2 w-full rounded-lg border text-sm px-4 py-2 hover:bg-muted transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync now"}
              </button>
              {syncResult && (
                <p className={`text-xs text-center ${syncResult.includes("complete") ? "text-emerald-600" : "text-red-500"}`}>
                  {syncResult}
                </p>
              )}
              <div className="flex gap-2">
                <a
                  href="/api/connect/quickbooks/auth"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg border px-3 py-2 hover:bg-muted transition-colors"
                >
                  Reconnect
                </a>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex-1 text-xs text-red-500 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-60"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            </div>
          )}

          {/* ── API Key providers ── */}
          {!isQB && provider.authType === "apikey" && provider.fields && (
            <form onSubmit={handleApiKeySave} className="space-y-4">
              {provider.fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <label className="text-xs font-medium">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={fields[field.name] ?? ""}
                    onChange={(e) => setFields((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    required={!field.label.toLowerCase().includes("optional")}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                  />
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{field.helpText}</p>
                  )}
                </div>
              ))}

              {isConnected && !saved && (
                <div className="space-y-2">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 px-3 py-2 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Connected — enter new credentials to update</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSyncNow}
                      disabled={syncing}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border text-sm px-4 py-2 hover:bg-muted transition-colors disabled:opacity-60"
                    >
                      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                      {syncing ? "Syncing..." : "Sync now"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="flex items-center justify-center gap-2 rounded-lg border border-red-200 text-red-500 text-sm px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-60"
                    >
                      {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                    </button>
                  </div>
                  {syncResult && (
                    <p className={`text-xs text-center ${syncResult.includes("complete") ? "text-emerald-600" : "text-red-500"}`}>
                      {syncResult}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || saved}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saved
                  ? <><CheckCircle2 className="h-4 w-4" /> Saved!</>
                  : loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  : <>{isConnected ? "Update credentials" : `Connect ${provider.name}`} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* ── Coming soon ── */}
          {provider.authType === "coming_soon" && (
            <div className="rounded-lg border-2 border-dashed border-muted px-4 py-6 text-center space-y-2">
              <p className="text-sm font-medium">Coming soon</p>
              <p className="text-xs text-muted-foreground">
                {provider.name} integration is on the roadmap.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex items-center justify-between bg-muted/20">
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" /> View docs
          </a>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
