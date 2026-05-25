"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Eye, EyeOff, Loader2, ArrowLeft, Volume2 } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function ElevenLabsPage() {
  const [apiKey, setApiKey] = useState("")
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM")
  const [scriptTemplate, setScriptTemplate] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [connected, setConnected] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings/financial")
        if (!res.ok) return
        const s = await res.json()
        if (s.elevenLabsApiKey) { setApiKey(s.elevenLabsApiKey); setConnected(true) }
        if (s.elevenLabsVoiceId) setVoiceId(s.elevenLabsVoiceId)
        if (s.voiceScriptTemplate) setScriptTemplate(s.voiceScriptTemplate)
        if (typeof s.enableVoiceSummary === "boolean") setEnabled(s.enableVoiceSummary)
      } catch {
        toast.error("Failed to load ElevenLabs settings")
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) { toast.error("API Key is required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elevenLabsApiKey: apiKey.trim(),
          elevenLabsVoiceId: voiceId.trim(),
          voiceScriptTemplate: scriptTemplate.trim(),
          enableVoiceSummary: enabled,
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      setConnected(true)
      toast.success("ElevenLabs connected successfully")
    } catch {
      toast.error("Failed to save ElevenLabs settings")
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Disconnect ElevenLabs? Voice summaries will be disabled.")) return
    setSaving(true)
    try {
      const res = await fetch("/api/settings/financial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elevenLabsApiKey: null, enableVoiceSummary: false }),
      })
      if (!res.ok) throw new Error("Failed")
      setApiKey("")
      setConnected(false)
      setEnabled(false)
      toast.success("ElevenLabs disconnected")
    } catch {
      toast.error("Failed to disconnect ElevenLabs")
    } finally {
      setSaving(false)
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
          <h1 className="text-3xl font-bold tracking-tight">ElevenLabs Connector</h1>
          <p className="text-muted-foreground">Generate AI voice briefings after significant financial events.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center h-5 w-5 rounded bg-orange-100 dark:bg-orange-900/30">
              <Volume2 className="h-3 w-3 text-orange-600 dark:text-orange-400" />
            </div>
            ElevenLabs
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
            Connect your ElevenLabs account to generate realistic AI voice summaries after agent workflows complete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  placeholder="sk_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                From <strong>elevenlabs.io → Profile → API Keys</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voiceId">Voice ID</Label>
              <Input
                id="voiceId"
                placeholder="21m00Tcm4TlvDq8ikWAM"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Find Voice IDs in the <strong>ElevenLabs Voice Library</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scriptTemplate">Voice Script Template</Label>
              <textarea
                id="scriptTemplate"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={scriptTemplate}
                onChange={(e) => setScriptTemplate(e.target.value)}
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
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {connected ? "Update" : "Connect ElevenLabs"}
              </Button>
              {connected && (
                <Button type="button" variant="outline" onClick={handleDisconnect} disabled={saving} className="text-destructive hover:text-destructive">
                  Disconnect
                </Button>
              )}
            </div>
          </form>

          {!connected && (
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
    </div>
  )
}
