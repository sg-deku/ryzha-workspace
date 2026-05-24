"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

type SuggestType = "expense" | "purchase" | "customer" | "vendor" | "sales-order"

interface AISuggestBarProps {
  type: SuggestType
  placeholder?: string
  onSuggestion: (data: any) => void
  disabled?: boolean
}

const DEFAULT_PLACEHOLDERS: Record<SuggestType, string> = {
  expense: "e.g. $250 Notion subscription for product team, monthly",
  purchase: "e.g. 10 units of office chairs at $300 each from Herman Miller",
  customer: "e.g. Acme Corp, contact jane@acme.com, enterprise client",
  vendor: "e.g. AWS cloud services, payment NET30, contact billing@aws.com",
  "sales-order": "e.g. 5 annual SaaS licenses at $2400 each for Startup Inc",
}

export function AISuggestBar({ type, placeholder, onSuggestion, disabled }: AISuggestBarProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSuggest = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, prompt: input.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "AI suggest failed")
      }
      const data = await res.json()
      onSuggestion(data)
      setInput("")
      toast.success("AI suggestions applied!")
    } catch (err: any) {
      toast.error(err.message || "AI assist failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-violet-200/60 bg-gradient-to-r from-violet-50/60 to-indigo-50/40 dark:from-violet-950/20 dark:to-indigo-950/10 dark:border-violet-800/30 shadow-sm">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-xs font-semibold text-violet-800 dark:text-violet-300 uppercase tracking-wide">
            AI Assistant
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder ?? DEFAULT_PLACEHOLDERS[type]}
            disabled={loading || disabled}
            className="flex-1 text-sm bg-background/80 border-violet-200 focus-visible:ring-violet-400 dark:border-violet-800/50"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSuggest()}
          />
          <Button
            onClick={handleSuggest}
            disabled={loading || !input.trim() || disabled}
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white min-w-[100px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Fill with AI
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
