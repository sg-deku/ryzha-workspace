"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const ACCOUNT_TYPES = ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"]

interface Line {
  accountType: string
  accountName: string
  debit: string
  credit: string
  description: string
}

const emptyLine = (): Line => ({
  accountType: "Expenses",
  accountName: "",
  debit: "",
  credit: "",
  description: "",
})

export default function NewJournalEntryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState("")
  const [description, setDescription] = useState("")
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()])

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isBalanced) {
      toast.error("Entry is not balanced. Debits must equal credits.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate,
          reference: reference || null,
          description,
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

      toast.success("Journal entry posted")
      router.push("/journal-entries")
    } catch (err: any) {
      toast.error(err.message || "Failed to create entry")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/journal-entries">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">New Journal Entry</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Date *</Label>
              <Input
                id="entryDate"
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference #</Label>
              <Input
                id="reference"
                placeholder="JE-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                required
                placeholder="Monthly depreciation"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lines</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-1" /> Add Line
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                <div className="col-span-2">Account Type</div>
                <div className="col-span-3">Account Name</div>
                <div className="col-span-2">Debit</div>
                <div className="col-span-2">Credit</div>
                <div className="col-span-2">Description</div>
                <div className="col-span-1"></div>
              </div>

              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-2">
                    <select
                      value={line.accountType}
                      onChange={(e) => updateLine(i, "accountType", e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="e.g. Cash"
                      value={line.accountName}
                      onChange={(e) => updateLine(i, "accountName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={line.debit}
                      onChange={(e) => updateLine(i, "debit", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={line.credit}
                      onChange={(e) => updateLine(i, "credit", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Optional"
                      value={line.description}
                      onChange={(e) => updateLine(i, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(i)}
                      disabled={lines.length <= 2}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-12 gap-2 border-t pt-3 text-sm font-semibold">
                <div className="col-span-5 text-right text-muted-foreground">Totals</div>
                <div className="col-span-2 px-3">
                  ${totalDebit.toFixed(2)}
                </div>
                <div className="col-span-2 px-3">
                  ${totalCredit.toFixed(2)}
                </div>
                <div className="col-span-3">
                  {isBalanced ? (
                    <span className="text-green-600 text-xs">Balanced</span>
                  ) : (
                    <span className="text-red-600 text-xs">
                      Off by ${Math.abs(totalDebit - totalCredit).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !isBalanced}>
            {isLoading ? "Posting..." : "Post Entry"}
          </Button>
        </div>
      </form>
    </div>
  )
}
