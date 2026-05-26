"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2, ArrowLeft, Copy } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

export const dynamic = 'force-dynamic'

export default function StripeIntegrationPage() {
  const { data: session } = useSession()
  const orgId = (session?.user as any)?.organizationId || "YOUR_ORG_ID"

  const [stripeKey, setStripeKey] = useState("")
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("")
  const [showStripeKey, setShowStripeKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [stripeConnected, setStripeConnected] = useState(false)
  const [stripeSaving, setStripeSaving] = useState(false)
  
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const fetchData = async () => {
    try {
      const sRes = await fetch("/api/settings/financial")
      if (sRes.ok) {
        const settings = await sRes.json()
        if (settings.stripeSecretKey) {
          setStripeKey(settings.stripeSecretKey)
          setStripeConnected(true)
        }
        if (settings.stripeWebhookSecret) {
          setStripeWebhookSecret(settings.stripeWebhookSecret)
        }
      }
    } catch {
      toast.error("Failed to fetch integration data")
    }
  }

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await fetch("/api/integrations/stripe/logs")
      if (res.ok) {
        setLogs(await res.json())
      }
    } catch {
      // fail silently for logs
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchLogs()
  }, [])

  const handleSaveStripe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripeKey.trim()) {
      toast.error("Stripe Secret Key is required")
      return
    }
    setStripeSaving(true)
    try {
      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripeSecretKey: stripeKey.trim(),
          stripeWebhookSecret: stripeWebhookSecret.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      setStripeConnected(true)
      toast.success("Stripe connected successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to save Stripe settings")
    } finally {
      setStripeSaving(false)
    }
  }

  const handleDisconnectStripe = async () => {
    if (!confirm("Remove Stripe connection? The app will fall back to the STRIPE_SECRET_KEY environment variable.")) return
    setStripeSaving(true)
    try {
      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeSecretKey: null, stripeWebhookSecret: null }),
      })
      if (!res.ok) throw new Error("Failed")
      setStripeKey("")
      setStripeWebhookSecret("")
      setStripeConnected(false)
      toast.success("Stripe disconnected")
    } catch {
      toast.error("Failed to disconnect Stripe")
    } finally {
      setStripeSaving(false)
    }
  }

  const handleCopyWebhook = () => {
    const url = `${window.location.origin}/api/webhooks/stripe?orgId=${orgId}`
    navigator.clipboard.writeText(url)
    toast.success("Webhook URL copied!")
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings/integrations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stripe Connector</h1>
          <p className="text-muted-foreground">Manage your Stripe connection and monitor incoming webhooks.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635BFF"/>
                  </svg>
                  Stripe
                  {stripeConnected ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not connected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Connect your Stripe account to receive payments and trigger the AI agent pipeline automatically.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveStripe} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripeKey">Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="stripeKey"
                      type={showStripeKey ? "text" : "password"}
                      placeholder="sk_live_... or sk_test_..."
                      value={stripeKey}
                      onChange={(e) => setStripeKey(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showStripeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From the <strong>Stripe Dashboard → Developers → API keys</strong>. Use a test key for development.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Signing Secret <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <div className="relative">
                    <Input
                      id="webhookSecret"
                      type={showWebhookSecret ? "text" : "password"}
                      placeholder="whsec_..."
                      value={stripeWebhookSecret}
                      onChange={(e) => setStripeWebhookSecret(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebhookSecret((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From <strong>Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret</strong>.
                    Required to verify webhook payloads from Stripe.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={stripeSaving}>
                    {stripeSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {stripeConnected ? "Update" : "Connect Stripe"}
                  </Button>
                  {stripeConnected && (
                    <Button type="button" variant="outline" onClick={handleDisconnectStripe} disabled={stripeSaving} className="text-destructive hover:text-destructive">
                      Disconnect
                    </Button>
                  )}
                </div>
              </form>

              {!stripeConnected && (
                <div className="mt-6 p-4 rounded-lg bg-muted/40 text-sm space-y-2">
                  <p className="font-medium">Setup steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Go to <strong>stripe.com → Developers → API keys</strong></li>
                    <li>Copy your <strong>Secret key</strong> (starts with <code>sk_</code>)</li>
                    <li>Paste it above and click <strong>Connect Stripe</strong></li>
                    <li>
                      In Stripe, add a webhook endpoint.
                      <div className="flex items-center gap-2 mt-2 mb-2 ml-4">
                        <code className="bg-background px-2 py-1 rounded border break-all text-xs">
                          https://yourdomain.com/api/webhooks/stripe?orgId={orgId}
                        </code>
                        <Button type="button" variant="outline" size="sm" onClick={handleCopyWebhook} className="h-7 text-xs whitespace-nowrap">
                          <Copy className="h-3 w-3 mr-1" /> Copy URL
                        </Button>
                      </div>
                    </li>
                    <li>Events to listen for: <code>payment_intent.succeeded</code>, <code>payout.paid</code>, <code>charge.refunded</code>, <code>payment_intent.payment_failed</code></li>
                    <li>Copy the <strong>Signing secret</strong> and paste it above</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stripe Event Logs</CardTitle>
            <CardDescription>Recent payment_intent events captured from Stripe webhooks.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-[35%]">Intent ID</TableHead>
                  <TableHead className="w-[15%]">Amount</TableHead>
                  <TableHead className="w-[20%]">Status</TableHead>
                  <TableHead className="pr-6 text-right w-[30%]">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="pl-6 font-mono text-xs max-w-0">
                      <span className="block truncate" title={log.stripePaymentIntentId}>
                        {log.stripePaymentIntentId}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      ${log.amount.toFixed(2)} {log.currency.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.workflowStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs text-right pr-6 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {!logsLoading && logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                      No Stripe events received yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
