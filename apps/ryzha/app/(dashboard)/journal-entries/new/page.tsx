"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, CheckCircle2, XCircle, Info, RotateCcw, Save, Send } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ACCOUNT_TYPES = ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"]

const ENTRY_TYPES = [
  { value: "REGULAR", label: "Regular Entry", desc: "Day-to-day business transactions (purchases, sales, payments)" },
  { value: "ADJUSTING", label: "Adjusting Entry", desc: "Period-end accruals, deferrals, and corrections" },
  { value: "CLOSING", label: "Closing Entry", desc: "Year-end transfer of revenue/expense to Retained Earnings" },
  { value: "REVERSING", label: "Reversing Entry", desc: "Auto-reversal of prior adjusting entries at period start" },
]

interface Line {
  accountType: string
  accountName: string
  debit: string
  credit: string
  description: string
}

interface Account {
  accountName: string
  accountType: string
  accountCode: string | null
}

const emptyLine = (): Line => ({
  accountType: "Expenses",
  accountName: "",
  debit: "",
  credit: "",
  description: "",
})

function AccountPicker({
  value,
  accountType,
  onChange,
}: {
  value: string
  accountType: string
  onChange: (name: string) => void
}) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Account[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string, type: string) => {
    const res = await fetch(`/api/chart-of-accounts/search?q=${encodeURIComponent(q)}&type=${type}`)
    if (res.ok) setResults(await res.json())
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (open) search(query, accountType)
    }, 200)
    return () => clearTimeout(t)
  }, [query, accountType, open, search])

  useEffect(() => {
    if (open) search(query, accountType)
  }, [open])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    setQuery(value)
  }, [value])

  return (
    <div className="relative" ref={ref}>
      <Input
        placeholder="Search accounts…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        className="text-sm"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {results.map((a) => (
            <button
              key={a.accountName}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2"
              onMouseDown={() => { onChange(a.accountName); setQuery(a.accountName); setOpen(false) }}
            >
              <span>{a.accountName}</span>
              <span className="text-xs text-muted-foreground">{a.accountType}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NewJournalEntryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState("")
  const [description, setDescription] = useState("")
  const [entryType, setEntryType] = useState("REGULAR")
  const [period, setPeriod] = useState("")
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()])

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const diff = Math.abs(totalDebit - totalCredit)
  const isBalanced = diff < 0.01
  const hasAmounts = totalDebit > 0 || totalCredit > 0

  const selectedType = ENTRY_TYPES.find((t) => t.value === entryType)!

  const updateLine = (index: number, field: keyof Line, value: string) => {
    setLines((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addLine = () => setLines((prev) => [...prev, emptyLine()])

  const removeLine = (index: number) => {
    if (lines.length <= 2) return
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  const submit = async (asDraft: boolean) => {
    if (!asDraft && !isBalanced) {
      toast.error("Entry is not balanced. Debits must equal credits.")
      return
    }
    asDraft ? setIsSavingDraft(true) : setIsLoading(true)

    try {
      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate,
          reference: reference || null,
          description,
          type: entryType,
          period: period || null,
          status: asDraft ? "DRAFT" : "POSTED",
          lines: lines.map((l) => ({
            ...l,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create entry")
      }

      toast.success(asDraft ? "Draft saved" : "Journal entry posted to General Ledger")
      router.push("/journal-entries")
    } catch (err: any) {
      toast.error(err.message || "Failed to create entry")
    } finally {
      setIsLoading(false)
      setIsSavingDraft(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/journal-entries"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Journal Entry</h2>
          <p className="text-muted-foreground text-sm">Double-entry bookkeeping — debits must equal credits before posting</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Date *</Label>
              <Input id="entryDate" type="date" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference #</Label>
              <Input id="reference" placeholder="JE-001" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Accounting Period</Label>
              <Input id="period" placeholder="2026-05" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2 md:col-span-4">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                required
                placeholder={entryType === "ADJUSTING" ? "e.g. Accrue December utilities expense" : "e.g. Monthly software subscription payment"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-400/60 bg-violet-50/30 dark:bg-violet-950/10">
          <CardContent className="pt-4 pb-3 flex items-start gap-3">
            <Info className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-violet-800 dark:text-violet-300">{selectedType.label}</p>
              <p className="text-xs text-violet-600 dark:text-violet-400">{selectedType.desc}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Journal Lines</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-1" /> Add Line
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1 pb-1 border-b">
                <div className="col-span-2">Account Type</div>
                <div className="col-span-3">Account Name</div>
                <div className="col-span-2 text-right">Debit ($)</div>
                <div className="col-span-2 text-right">Credit ($)</div>
                <div className="col-span-2">Memo</div>
                <div className="col-span-1"></div>
              </div>

              {lines.map((line, i) => (
                <div key={i} className={cn("grid grid-cols-12 gap-2 items-center rounded-md px-1 py-1", i % 2 === 0 ? "bg-muted/20" : "")}>
                  <div className="col-span-2">
                    <select
                      value={line.accountType}
                      onChange={(e) => updateLine(i, "accountType", e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <AccountPicker
                      value={line.accountName}
                      accountType={line.accountType}
                      onChange={(name) => updateLine(i, "accountName", name)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="text-right"
                      value={line.debit}
                      onChange={(e) => { updateLine(i, "debit", e.target.value); if (e.target.value) updateLine(i, "credit", "") }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="text-right"
                      value={line.credit}
                      onChange={(e) => { updateLine(i, "credit", e.target.value); if (e.target.value) updateLine(i, "debit", "") }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Optional" value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(i)} disabled={lines.length <= 2}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-12 gap-2 border-t pt-3 text-sm font-semibold mt-2">
                <div className="col-span-5 text-right text-muted-foreground pr-2">Totals</div>
                <div className="col-span-2 text-right font-mono text-sm">
                  {hasAmounts && `$${totalDebit.toFixed(2)}`}
                </div>
                <div className="col-span-2 text-right font-mono text-sm">
                  {hasAmounts && `$${totalCredit.toFixed(2)}`}
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  {hasAmounts && (
                    isBalanced ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Balanced
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                        <XCircle className="h-3.5 w-3.5" /> Off by ${diff.toFixed(2)}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Posted entries are locked and posted to the General Ledger immediately. Use <strong>Save Draft</strong> to continue editing later.
          </div>
          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading || isSavingDraft}>
              Cancel
            </Button>
            <Button variant="outline" type="button" disabled={isLoading || isSavingDraft || !description} onClick={() => submit(true)}>
              {isSavingDraft ? "Saving…" : <><Save className="h-4 w-4 mr-1.5" />Save Draft</>}
            </Button>
            <Button type="button" disabled={isLoading || isSavingDraft || !isBalanced || !description || !hasAmounts} onClick={() => submit(false)}>
              {isLoading ? "Posting…" : <><Send className="h-4 w-4 mr-1.5" />Post Entry</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
