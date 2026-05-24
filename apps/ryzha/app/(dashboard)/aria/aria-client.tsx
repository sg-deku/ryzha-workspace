"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Send, Sparkles, Zap, X, RotateCcw, ChevronRight, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AriaMessage {
  id: string
  role: "user" | "aria"
  content: string
  action?: string
  result?: {
    success: boolean
    entityType?: string
    entityId?: string
    link?: string
    summary?: string
    error?: string
  }
  timestamp: Date
  pending?: boolean
}

const ACTION_ICONS: Record<string, string> = {
  create_invoice: "🧾",
  create_expense: "💸",
  create_customer: "🏢",
  create_vendor: "🏭",
  create_purchase_order: "📦",
  create_sales_order: "📋",
  query_invoices: "🔍",
  query_expenses: "🔍",
  query_customers: "🔍",
  query_vendors: "🔍",
  query_financial_summary: "📊",
  none: "💬",
}

const ENTITY_LABELS: Record<string, string> = {
  invoice: "Invoice",
  expense: "Expense",
  customer: "Customer",
  vendor: "Vendor",
  purchase_order: "Purchase Order",
  sales_order: "Sales Order",
}

const SUGGESTIONS = [
  "Create an invoice for Acme Corp for 5 hours of consulting at $200/hr",
  "Add an expense: $180 Figma subscription, category Software",
  "Add a new customer: TechStart Inc, email cfo@techstart.com",
  "Show me all overdue invoices",
  "What's our financial overview?",
  "Create a vendor: AWS cloud services, NET30 payment terms",
]

function AriaMarkdown({ content, onLinkClick }: { content: string; onLinkClick?: (href: string) => void }) {
  const lines = content.split("\n")
  return (
    <>
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
        const rendered = parts.map((part, j) => {
          const boldMatch = part.match(/^\*\*([^*]+)\*\*$/)
          if (boldMatch) return <strong key={j} className="font-semibold">{boldMatch[1]}</strong>

          const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
          if (linkMatch) {
            return (
              <Link
                key={j}
                href={linkMatch[2]}
                className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium"
                onClick={(e: React.MouseEvent) => { if (onLinkClick) { e.preventDefault(); onLinkClick(linkMatch[2]) } }}
              >
                {linkMatch[1]}
              </Link>
            )
          }

          return <span key={j}>{part}</span>
        })

        const isBullet = line.startsWith("• ") || line.startsWith("- ")
        if (isBullet) {
          return (
            <div key={i} className="flex gap-2 text-muted-foreground">
              <span className="text-primary/60 mt-0.5 flex-shrink-0">•</span>
              <span className="flex-1">{rendered.slice(1)}</span>
            </div>
          )
        }

        if (line === "") return <div key={i} className="h-1" />

        return <p key={i} className="text-foreground">{rendered}</p>
      })}
    </>
  )
}

function AriaMessageBubble({ msg, onLinkClick }: { msg: AriaMessage; onLinkClick?: (href: string) => void }) {
  const isUser = msg.role === "user"

  return (
    <div className={cn("flex gap-3 animate-fade-in", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <div className={cn("flex flex-col gap-1.5 max-w-[78%]", isUser && "items-end")}>
        {isUser ? (
          <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm shadow-sm">
            {msg.content}
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3 text-sm shadow-sm">
            {msg.pending ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="italic text-sm">Aria is thinking...</span>
              </div>
            ) : (
              <>
                {msg.action && msg.action !== "none" && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1 w-fit">
                    <span>{ACTION_ICONS[msg.action] || "⚡"}</span>
                    <span>{msg.action.replace(/_/g, " ")}</span>
                  </div>
                )}
                <div className="space-y-1 text-sm leading-relaxed">
                  <AriaMarkdown content={msg.content} onLinkClick={onLinkClick} />
                </div>

                {msg.result?.success && msg.result.link && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{ENTITY_LABELS[msg.result.entityType || ""] || "Entity"} created</span>
                    </div>
                    <Link
                      href={msg.result.link}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                {msg.result && !msg.result.success && msg.result.error && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{msg.result.error}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <span className="text-[10px] text-muted-foreground/60 px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  )
}

const WELCOME_MSG = (userName?: string | null): AriaMessage => ({
  id: "welcome",
  role: "aria",
  content: `Hello${userName ? `, **${userName.split(" ")[0]}**` : ""}. I'm **Aria**, your AI accounting co-pilot.\n\nI can create invoices, log expenses, add customers and vendors, query your financial data, and more — all through conversation.\n\nWhat would you like to do?`,
  timestamp: new Date(),
})

export function AriaClient({ userName }: { userName?: string | null }) {
  const router = useRouter()
  const [messages, setMessages] = useState<AriaMessage[]>([WELCOME_MSG(userName)])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch("/api/aria")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.messages?.length) {
          const restored: AriaMessage[] = data.messages.map((m: any) => ({
            id: m.id,
            role: m.role === "aria_user" ? "user" : "aria",
            content: m.content,
            timestamp: new Date(m.createdAt),
          }))
          setMessages(restored)
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const history = messages
    .filter((m) => !m.pending)
    .map((m) => ({ role: m.role === "aria" ? "assistant" : "user", content: m.content }))

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setInput("")

    const userMsg: AriaMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    }

    const pendingMsg: AriaMessage = {
      id: `pending-${Date.now()}`,
      role: "aria",
      content: "",
      timestamp: new Date(),
      pending: true,
    }

    setMessages((prev) => [...prev, userMsg, pendingMsg])
    setLoading(true)

    try {
      const res = await fetch("/api/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      })

      if (!res.ok) throw new Error("Aria is unavailable — please contact your administrator to configure the AI provider")

      const data = await res.json()

      const replyContent = data.result?.summary
        ? `${data.message}\n\n${data.result.summary}`
        : data.message || "Done."

      const ariaMsg: AriaMessage = {
        id: `a-${Date.now()}`,
        role: "aria",
        content: replyContent,
        action: data.action,
        result: data.result,
        timestamp: new Date(),
      }

      setMessages((prev) => prev.filter((m) => !m.pending).concat(ariaMsg))
    } catch (err: any) {
      const errMsg: AriaMessage = {
        id: `err-${Date.now()}`,
        role: "aria",
        content: `⚠️ ${err.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => prev.filter((m) => !m.pending).concat(errMsg))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [loading, history])

  const handleClear = async () => {
    await fetch("/api/aria", { method: "DELETE" })
    setMessages([WELCOME_MSG(userName)])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleLinkClick = (href: string) => {
    router.push(href)
  }

  const showSuggestions = historyLoaded && messages.length <= 1

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-card" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">Aria</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Accounting Co-pilot</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear history
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/dashboard")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {!historyLoaded ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Loading conversation...</span>
            </div>
          ) : (
            messages.map((msg) => (
              <AriaMessageBubble key={msg.id} msg={msg} onLinkClick={handleLinkClick} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {showSuggestions && (
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 px-0.5">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-muted hover:bg-muted/80 border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-primary/50 group-hover:text-primary transition-colors" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-t bg-card px-4 pb-5 pt-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-background border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
            <Sparkles className="h-4 w-4 text-primary/50 flex-shrink-0 mb-0.5" />
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell Aria what to do... (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              rows={1}
              className="flex-1 bg-transparent border-none shadow-none resize-none text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-0 focus-visible:ring-offset-0 min-h-0 max-h-32 overflow-auto p-0"
              style={{ height: "auto" }}
              onInput={(e) => {
                const t = e.currentTarget
                t.style.height = "auto"
                t.style.height = `${t.scrollHeight}px`
              }}
            />
            <Button
              size="icon"
              disabled={loading || !input.trim()}
              onClick={() => sendMessage(input)}
              className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-30 transition-all hover:scale-[1.05] active:scale-[0.95]"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
              ) : (
                <Send className="h-3.5 w-3.5 text-primary-foreground" />
              )}
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
            Aria can make mistakes. Review created records before sharing.
          </p>
        </div>
      </div>
    </div>
  )
}
