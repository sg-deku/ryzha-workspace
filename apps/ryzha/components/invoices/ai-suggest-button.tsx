"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AISuggestButtonProps {
  onSuggestions: (suggestions: any[]) => void
  clientEmail?: string
}

export function AISuggestButton({ onSuggestions, clientEmail }: AISuggestButtonProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSuggest = async () => {
    if (!input) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/invoices/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: input, clientEmail })
      })
      
      if (res.ok) {
        const data = await res.json()
        onSuggestions(data)
        setInput("")
        toast.success("AI suggestions applied!")
      } else {
        toast.error("Failed to get suggestions")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-purple-100 bg-purple-50/50 dark:bg-purple-900/10 dark:border-purple-900/20 shadow-sm overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full animate-pulse">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-sm font-semibold text-purple-900 dark:text-purple-300">AI Invoice Assistant</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="e.g. 10 hours of consulting at $150/hr for March project" 
            className="flex-1 bg-background border-purple-200 focus-visible:ring-purple-400"
            onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
          />
          <Button 
            onClick={handleSuggest}
            disabled={isLoading || !input}
            className="bg-purple-600 hover:bg-purple-700 text-white min-w-[120px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Suggest
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
