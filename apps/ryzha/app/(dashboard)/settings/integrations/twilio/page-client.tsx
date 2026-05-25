"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2, ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function TwilioPage() {
  const [accountSid, setAccountSid] = useState("")
  const [authToken, setAuthToken] = useState("")
  const [fromNumber, setFromNumber] = useState("")
  const [recipientNumber, setRecipientNumber] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [connected, setConnected] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings/financial")
        if (!res.ok) return
        const s = await res.json()
        if (s.twilioAccountSid) { setAccountSid(s.twilioAccountSid); setConnected(true) }
        if (s.twilioAuthToken) setAuthToken(s.twilioAuthToken)
        if (s.twilioFromNumber) setFromNumber(s.twilioFromNumber)
        if (s.smsRecipientNumber) setRecipientNumber(s.smsRecipientNumber)
        if (typeof s.enableSMS === "boolean") setEnabled(s.enableSMS)
      } catch {
        toast.error("Failed to load Twilio settings")
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountSid.trim() || !authToken.trim() || !fromNumber.trim()) {
      toast.error("Account SID, Auth Token and From Number are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twilioAccountSid: accountSid.trim(),
          twilioAuthToken: authToken.trim(),
          twilioFromNumber: fromNumber.trim(),
          smsRecipientNumber: recipientNumber.trim() || null,
          enableSMS: enabled,
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      setConnected(true)
      toast.success("Twilio connected successfully")
    } catch {
      toast.error("Failed to save Twilio settings")
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Twilio? SMS notifications will be disabled.")) return
    setSaving(true)
    try {
      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twilioAccountSid: null, twilioAuthToken: null, twilioFromNumber: null, enableSMS: false }),
      })
      if (!res.ok) throw new Error("Failed")
      setAccountSid("")
      setAuthToken("")
      setFromNumber("")
      setConnected(false)
      setEnabled(false)
      toast.success("Twilio disconnected")
    } catch {
      toast.error("Failed to disconnect Twilio")
    } finally {
      setSaving(false)
    }
  }

  const handleTestSms = async () => {
    if (!recipientNumber.trim()) { toast.error("Set a recipient number first"); return }
    setTesting(true)
    try {
      const res = await fetch("/api/integrations/voice-sms/test-sms", { method: "POST" })
      if (res.ok) {
        toast.success("Test SMS sent successfully")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to send test SMS")
      }
    } catch {
      toast.error("Failed to send test SMS")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/settings/integrations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Twilio Connector</h1>
          <p className="text-muted-foreground">Send SMS notifications after agent workflow completions.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center h-5 w-5 rounded bg-red-100 dark:bg-red-900/30">
              <MessageSquare className="h-3 w-3 text-red-600 dark:text-red-400" />
            </div>
            Twilio
            {connected ? (
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
            Connect your Twilio account to send SMS notifications to founders or team members after agent runs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountSid">Account SID</Label>
              <Input
                id="accountSid"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                From <strong>console.twilio.com → Account → General Settings</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="authToken">Auth Token</Label>
              <div className="relative">
                <Input
                  id="authToken"
                  type={showToken ? "text" : "password"}
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromNumber">From Number</Label>
                <Input
                  id="fromNumber"
                  placeholder="+15551234567"
                  value={fromNumber}
                  onChange={(e) => setFromNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Your Twilio phone number.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientNumber">Recipient Number</Label>
                <Input
                  id="recipientNumber"
                  placeholder="+15559876543"
                  value={recipientNumber}
                  onChange={(e) => setRecipientNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Number that receives the SMS alerts.</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <Label>Enable SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send brief summaries via Twilio after agent runs.</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {connected ? "Update" : "Connect Twilio"}
              </Button>
              {connected && (
                <>
                  <Button type="button" variant="outline" onClick={handleTestSms} disabled={testing}>
                    {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                    Send Test SMS
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDisconnect} disabled={saving} className="text-destructive hover:text-destructive">
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </form>

          {!connected && (
            <div className="mt-6 p-4 rounded-lg bg-muted/40 text-sm space-y-2">
              <p className="font-medium">Setup steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Go to <strong>console.twilio.com</strong> and sign in</li>
                <li>Copy your <strong>Account SID</strong> and <strong>Auth Token</strong> from the dashboard</li>
                <li>Get or purchase a <strong>Twilio phone number</strong></li>
                <li>Paste all three above and click <strong>Connect Twilio</strong></li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
