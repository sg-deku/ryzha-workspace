"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2, ArrowLeft, Mic, MessageSquare } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function VoiceSmsPage() {
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("")
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState("21m00Tcm4TlvDq8ikWAM")
  const [voiceScriptTemplate, setVoiceScriptTemplate] = useState(
    "Karina, a {{amount}} credit has been reconciled under ASC 606. This improves our net income for the quarter and extends our cash runway by {{runwayDays}} days, moving our 'Zero Cash Date' to {{zeroCashDate}}. We are currently {{percentAhead}}% ahead of our financial plan."
  )
  const [enableVoiceSummary, setEnableVoiceSummary] = useState(false)
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false)
  const [elevenLabsConnected, setElevenLabsConnected] = useState(false)
  const [elevenLabsSaving, setElevenLabsSaving] = useState(false)

  const [twilioAccountSid, setTwilioAccountSid] = useState("")
  const [twilioAuthToken, setTwilioAuthToken] = useState("")
  const [twilioFromNumber, setTwilioFromNumber] = useState("")
  const [smsRecipientNumber, setSmsRecipientNumber] = useState("")
  const [enableSMS, setEnableSMS] = useState(false)
  const [showTwilioToken, setShowTwilioToken] = useState(false)
  const [twilioConnected, setTwilioConnected] = useState(false)
  const [twilioSaving, setTwilioSaving] = useState(false)
  const [smsTesting, setSmsTesting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings/financial")
        if (!res.ok) return
        const s = await res.json()
        if (s.elevenLabsApiKey) { setElevenLabsApiKey(s.elevenLabsApiKey); setElevenLabsConnected(true) }
        if (s.elevenLabsVoiceId) setElevenLabsVoiceId(s.elevenLabsVoiceId)
        if (s.voiceScriptTemplate) setVoiceScriptTemplate(s.voiceScriptTemplate)
        if (typeof s.enableVoiceSummary === "boolean") setEnableVoiceSummary(s.enableVoiceSummary)
        if (s.twilioAccountSid) { setTwilioAccountSid(s.twilioAccountSid); setTwilioConnected(true) }
        if (s.twilioAuthToken) setTwilioAuthToken(s.twilioAuthToken)
        if (s.twilioFromNumber) setTwilioFromNumber(s.twilioFromNumber)
        if (s.smsRecipientNumber) setSmsRecipientNumber(s.smsRecipientNumber)
        if (typeof s.enableSMS === "boolean") setEnableSMS(s.enableSMS)
      } catch {
        toast.error("Failed to load connector settings")
      }
    }
    load()
  }, [])

  const handleSaveElevenLabs = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!elevenLabsApiKey.trim()) { toast.error("ElevenLabs API Key is required"); return }
    setElevenLabsSaving(true)
    try {
      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elevenLabsApiKey: elevenLabsApiKey.trim(),
          elevenLabsVoiceId: elevenLabsVoiceId.trim(),
          voiceScriptTemplate: voiceScriptTemplate.trim(),
          enableVoiceSummary,
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      setElevenLabsConnected(true)
      toast.success("ElevenLabs connected successfully")
    } catch {
      toast.error("Failed to save ElevenLabs settings")
    } finally {
      setElevenLabsSaving(false)
    }
  }

  const handleDisconnectElevenLabs = async () => {
    if (!confirm("Disconnect ElevenLabs? Voice summaries will be disabled.")) return
    setElevenLabsSaving(true)
    try {
      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elevenLabsApiKey: null, enableVoiceSummary: false }),
      })
      if (!res.ok) throw new Error("Failed")
      setElevenLabsApiKey("")
      setElevenLabsConnected(false)
      setEnableVoiceSummary(false)
      toast.success("ElevenLabs disconnected")
    } catch {
      toast.error("Failed to disconnect ElevenLabs")
    } finally {
      setElevenLabsSaving(false)
    }
  }

  const handleSaveTwilio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!twilioAccountSid.trim() || !twilioAuthToken.trim() || !twilioFromNumber.trim()) {
      toast.error("Account SID, Auth Token and From Number are required")
      return
    }
    setTwilioSaving(true)
    try {
      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twilioAccountSid: twilioAccountSid.trim(),
          twilioAuthToken: twilioAuthToken.trim(),
          twilioFromNumber: twilioFromNumber.trim(),
          smsRecipientNumber: smsRecipientNumber.trim() || null,
          enableSMS,
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      setTwilioConnected(true)
      toast.success("Twilio connected successfully")
    } catch {
      toast.error("Failed to save Twilio settings")
    } finally {
      setTwilioSaving(false)
    }
  }

  const handleDisconnectTwilio = async () => {
    if (!confirm("Disconnect Twilio? SMS notifications will be disabled.")) return
    setTwilioSaving(true)
    try {
      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twilioAccountSid: null, twilioAuthToken: null, twilioFromNumber: null, enableSMS: false }),
      })
      if (!res.ok) throw new Error("Failed")
      setTwilioAccountSid("")
      setTwilioAuthToken("")
      setTwilioFromNumber("")
      setTwilioConnected(false)
      setEnableSMS(false)
      toast.success("Twilio disconnected")
    } catch {
      toast.error("Failed to disconnect Twilio")
    } finally {
      setTwilioSaving(false)
    }
  }

  const handleTestSms = async () => {
    if (!smsRecipientNumber.trim()) { toast.error("Set an SMS recipient number first"); return }
    setSmsTesting(true)
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
      setSmsTesting(false)
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Voice & SMS Connector</h1>
          <p className="text-muted-foreground">Manage ElevenLabs voice briefings and Twilio SMS notifications.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center h-5 w-5 rounded bg-orange-100 dark:bg-orange-900/30">
                <Mic className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              </div>
              ElevenLabs
              {elevenLabsConnected ? (
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
              Generate AI voice briefings after significant financial events using ElevenLabs TTS.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveElevenLabs} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="elevenLabsApiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="elevenLabsApiKey"
                  type={showElevenLabsKey ? "text" : "password"}
                  placeholder="sk_..."
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowElevenLabsKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showElevenLabsKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                From <strong>elevenlabs.io → Profile → API Keys</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="elevenLabsVoiceId">Voice ID</Label>
              <Input
                id="elevenLabsVoiceId"
                placeholder="21m00Tcm4TlvDq8ikWAM"
                value={elevenLabsVoiceId}
                onChange={(e) => setElevenLabsVoiceId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Find Voice IDs in the <strong>ElevenLabs Voice Library</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voiceScriptTemplate">Voice Script Template</Label>
              <textarea
                id="voiceScriptTemplate"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={voiceScriptTemplate}
                onChange={(e) => setVoiceScriptTemplate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available placeholders: <code>{"{{amount}}"}</code>, <code>{"{{runwayDays}}"}</code>, <code>{"{{zeroCashDate}}"}</code>, <code>{"{{percentAhead}}"}</code>
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <Label>Enable Voice Summaries</Label>
                <p className="text-sm text-muted-foreground">Generate audio briefings after significant transactions.</p>
              </div>
              <Switch checked={enableVoiceSummary} onCheckedChange={setEnableVoiceSummary} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={elevenLabsSaving}>
                {elevenLabsSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {elevenLabsConnected ? "Update" : "Connect ElevenLabs"}
              </Button>
              {elevenLabsConnected && (
                <Button type="button" variant="outline" onClick={handleDisconnectElevenLabs} disabled={elevenLabsSaving} className="text-destructive hover:text-destructive">
                  Disconnect
                </Button>
              )}
            </div>
          </form>

          {!elevenLabsConnected && (
            <div className="mt-6 p-4 rounded-lg bg-muted/40 text-sm space-y-2">
              <p className="font-medium">Setup steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Go to <strong>elevenlabs.io</strong> and sign in</li>
                <li>Navigate to <strong>Profile → API Keys</strong></li>
                <li>Create a new key and paste it above</li>
                <li>Copy a Voice ID from the <strong>Voice Library</strong></li>
                <li>Customise the script template and click <strong>Connect ElevenLabs</strong></li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center h-5 w-5 rounded bg-red-100 dark:bg-red-900/30">
                <MessageSquare className="h-3 w-3 text-red-600 dark:text-red-400" />
              </div>
              Twilio
              {twilioConnected ? (
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
              Send SMS notifications to founders or team members after agent workflow completions.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveTwilio} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="twilioAccountSid">Account SID</Label>
              <Input
                id="twilioAccountSid"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={twilioAccountSid}
                onChange={(e) => setTwilioAccountSid(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                From <strong>console.twilio.com → Account → General Settings</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twilioAuthToken">Auth Token</Label>
              <div className="relative">
                <Input
                  id="twilioAuthToken"
                  type={showTwilioToken ? "text" : "password"}
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowTwilioToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showTwilioToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twilioFromNumber">From Number</Label>
                <Input
                  id="twilioFromNumber"
                  placeholder="+15551234567"
                  value={twilioFromNumber}
                  onChange={(e) => setTwilioFromNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Your Twilio phone number.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smsRecipientNumber">Recipient Number</Label>
                <Input
                  id="smsRecipientNumber"
                  placeholder="+15559876543"
                  value={smsRecipientNumber}
                  onChange={(e) => setSmsRecipientNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Number that receives the SMS alerts.</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <Label>Enable SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send brief summaries via Twilio after agent runs.</p>
              </div>
              <Switch checked={enableSMS} onCheckedChange={setEnableSMS} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={twilioSaving}>
                {twilioSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {twilioConnected ? "Update" : "Connect Twilio"}
              </Button>
              {twilioConnected && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestSms}
                    disabled={smsTesting}
                  >
                    {smsTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                    Send Test SMS
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDisconnectTwilio} disabled={twilioSaving} className="text-destructive hover:text-destructive">
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </form>

          {!twilioConnected && (
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
