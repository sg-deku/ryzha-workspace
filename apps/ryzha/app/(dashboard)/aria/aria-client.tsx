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
          if (boldMatch) return <strong key={j} className="font-semibold text-white/90">{boldMatch[1]}</strong>

          const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
          if (linkMatch) {
            return (
              <Link
                key={j}
                href={linkMatch[2]}
                className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
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
            <div key={i} className="flex gap-2 text-white/70">
              <span className="text-violet-400/70 mt-0.5">•</span>
              <span className="flex-1">{rendered.slice(1)}</span>
            </div>
          )
        }

        if (line === "") return <div key={i} className="h-1" />

        return <p key={i} className="text-white/80">{rendered}</p>
      })}
    </>
  )
}

function AriaMessageBubble({ msg, onLinkClick }: { msg: AriaMessage; onLinkClick?: (href: string) => void }) {
  const isUser = msg.role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Zap className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={cn("flex flex-col gap-2 max-w-[78%]", isUser && "items-end")}>
        {isUser ? (
          <div className="rounded-2xl rounded-tr-sm bg-violet-600 text-white px-4 py-2.5 text-sm shadow-md">
            {msg.content}
          </div>
        ) : (
          <div className="rounded-2xl rounded-tl-sm bg-white/5 dark:bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-foreground shadow-sm">
            {msg.pending ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                <span className="italic">Aria is thinking...</span>
              </div>
            ) : (
              <>
                {msg.action && msg.action !== "none" && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-violet-400 font-mono">
                    <span>{ACTION_ICONS[msg.action] || "⚡"}</span>
                    <span>{msg.action.replace(/_/g, " ")}</span>
                  </div>
                )}
                <div className="space-y-1 text-sm leading-relaxed">
                  <AriaMarkdown content={msg.content} onLinkClick={onLinkClick} />
                </div>

                {msg.result?.success && msg.result.link && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{ENTITY_LABELS[msg.result.entityType || ""] || "Entity"} created</span>
                    </div>
                    <Link
                      href={msg.result.link}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                {msg.result && !msg.result.success && msg.result.error && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{msg.result.error}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <span className="text-[10px] text-muted-foreground/50 px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  )
}

export function AriaClient({ userName }: { userName?: string | null }) {
  const router = useRouter()
  const [messages, setMessages] = useState<AriaMessage[]>([
    {
      id: "welcome",
      role: "aria",
      content: `Hello${userName ? `, **${userName.split(" ")[0]}**` : ""}. I'm **Aria**, your AI accounting co-pilot.\n\nI can create invoices, log expenses, add customers and vendors, query your financial data, and more — all through conversation.\n\nWhat would you like to do?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [entered, setEntered] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100)
    return () => clearTimeout(t)
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
      id: `a-${Date.now()}`,
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

      if (!res.ok) throw new Error("Aria is unavailable — check your AI configuration in Settings → Financial Engine")

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
        id: `a-${Date.now()}`,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleLinkClick = (href: string) => {
    router.push(href)
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-[#0a0a12] transition-all duration-700",
        entered ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 20% 10%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
          linear-gradient(to bottom, #0a0a12, #08080f)
        `,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0a12] animate-pulse" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm tracking-wide">Aria</h1>
            <p className="text-[10px] text-violet-400/70 tracking-wider uppercase">AI Accounting Co-pilot · Ryzha</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white/70 hover:bg-white/5 gap-1.5 text-xs"
            onClick={() => setMessages([{
              id: "welcome",
              role: "aria",
              content: "Session cleared. How can I help you?",
              timestamp: new Date(),
            }])}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/40 hover:text-white/70 hover:bg-white/5"
            onClick={() => router.push("/dashboard")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg) => (
            <AriaMessageBubble key={msg.id} msg={msg} onLinkClick={handleLinkClick} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {messages.length <= 1 && (
        <div className="relative z-10 px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 px-1">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white/60 hover:text-white/90 transition-all flex items-center gap-1.5 group"
                >
                  <ChevronRight className="h-3 w-3 text-violet-400/50 group-hover:text-violet-400 transition-colors" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 px-4 pb-6 pt-2 border-t border-white/[0.06] bg-black/10 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl px-4 py-3 focus-within:border-violet-500/50 focus-within:bg-white/[0.06] transition-all">
            <Sparkles className="h-4 w-4 text-violet-400/60 flex-shrink-0 mb-0.5" />
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell Aria what to do... (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              rows={1}
              className="flex-1 bg-transparent border-none shadow-none resize-none text-white/90 placeholder:text-white/25 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 min-h-0 max-h-32 overflow-auto p-0"
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
              className="flex-shrink-0 h-8 w-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 transition-all hover:scale-[1.05] active:scale-[0.95] shadow-lg shadow-violet-500/20"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <Send className="h-3.5 w-3.5 text-white" />
              )}
            </Button>
          </div>
          <p className="text-center text-[10px] text-white/20 mt-2">
            Aria can make mistakes. Review created records before sharing.
          </p>
        </div>
      </div>
    </div>
  )
}
