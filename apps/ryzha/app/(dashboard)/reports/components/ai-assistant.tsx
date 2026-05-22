"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"

interface Message {
  id: string
  query: string
  summary: string
  data: any
  chartType: string
  reportType: string
  timestamp: Date
}

function DataDisplay({ message }: { message: Message }) {
  const { data, chartType, reportType } = message

  if (!data) return null

  if (chartType === "table" || Array.isArray(data) || typeof data === "object") {
    if (
      reportType === "runway" &&
      typeof data === "object" &&
      !Array.isArray(data)
    ) {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2 border-b">
            <span className="text-muted-foreground">Bank Balance</span>
            <span className="font-semibold">${data.bankBalance?.toLocaleString() ?? "—"}</span>
          </div>
          <div className="flex justify-between p-2 border-b">
            <span className="text-muted-foreground">Avg Monthly Burn</span>
            <span className="font-semibold">${data.averageMonthlyExpenses?.toLocaleString() ?? "—"}</span>
          </div>
          <div className="flex justify-between p-2 border-b">
            <span className="text-muted-foreground">Runway</span>
            <span className="font-semibold text-green-600">{data.runwayMonths ?? "—"} months</span>
          </div>
          <div className="flex justify-between p-2">
            <span className="text-muted-foreground">Zero Cash Date</span>
            <span className="font-semibold">{data.zeroCashDate ?? "—"}</span>
          </div>
        </div>
      )
    }

    if (reportType === "profit_loss" && typeof data === "object" && !Array.isArray(data)) {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2 border-b">
            <span className="text-muted-foreground">Total Revenue</span>
            <span className="font-semibold text-green-600">${data.totalRevenue?.toLocaleString() ?? "—"}</span>
          </div>
          <div className="flex justify-between p-2 border-b">
            <span className="text-muted-foreground">Total Expenses</span>
            <span className="font-semibold text-red-600">${data.totalExpenses?.toLocaleString() ?? "—"}</span>
          </div>
          <div className="flex justify-between p-2 border-b">
            <span className="text-muted-foreground">Net Profit</span>
            <span className={`font-semibold ${(data.netProfit ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${data.netProfit?.toLocaleString() ?? "—"}
            </span>
          </div>
          <div className="flex justify-between p-2">
            <span className="text-muted-foreground">Margin</span>
            <span className="font-semibold">{data.margin ?? "—"}%</span>
          </div>
          {Array.isArray(data.byMonth) && data.byMonth.length > 0 && (
            <div className="mt-3 border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">Month</th>
                    <th className="p-2 text-right">Revenue</th>
                    <th className="p-2 text-right">Expenses</th>
                    <th className="p-2 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byMonth.map((row: any) => (
                    <tr key={row.month} className="border-t">
                      <td className="p-2">{row.month}</td>
                      <td className="p-2 text-right text-green-600">${row.revenue?.toLocaleString()}</td>
                      <td className="p-2 text-right text-red-600">${row.expenses?.toLocaleString()}</td>
                      <td className={`p-2 text-right font-medium ${(row.profit ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ${row.profit?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    }

    if (Array.isArray(data) && data.length > 0) {
      const keys = Object.keys(data[0])
      return (
        <div className="border rounded-lg overflow-auto max-h-64">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                {keys.map((k) => (
                  <th key={k} className="p-2 text-left capitalize whitespace-nowrap">
                    {k.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: any, i: number) => (
                <tr key={i} className="border-t">
                  {keys.map((k) => (
                    <td key={k} className="p-2 whitespace-nowrap">
                      {typeof row[k] === "number"
                        ? row[k] % 1 === 0
                          ? row[k].toLocaleString()
                          : row[k].toFixed(2)
                        : String(row[k] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (data.length === 0) {
      return <p className="text-sm text-muted-foreground">No data found for the selected period.</p>
    }
  }

  return <pre className="text-xs overflow-auto max-h-48 bg-muted/30 p-3 rounded">{JSON.stringify(data, null, 2)}</pre>
}

export function AIAssistant() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const query = input.trim()
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/reports/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Failed to process query")
      }

      const { data, summary, chartType, reportType } = json

      setMessages((prev) => [
        {
          id: Date.now().toString(),
          query,
          summary,
          data,
          chartType,
          reportType,
          timestamp: new Date(),
        },
        ...prev,
      ])
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ask Ryzha anything about your finances</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder='e.g. "Show me runway", "Expenses by category last quarter", "Which customers are overdue?"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            The AI will fetch live data and explain it in plain English.
          </p>
        </CardContent>
      </Card>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              Ask a question to get started. The AI will fetch live data and explain it.
            </div>
          )}
          {messages.map((msg) => (
            <Card key={msg.id} className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-base font-mono">📄 {msg.query}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg italic text-sm">
                  🤖 {msg.summary}
                </div>
                <div className="border rounded-lg p-4">
                  <DataDisplay message={msg} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
