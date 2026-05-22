"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
} from "lucide-react"
import Link from "next/link"
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns"

type AccountType = "All" | "Revenue" | "Expenses" | "Assets" | "Liabilities" | "Equity"
type SourceType = "All" | "Invoice" | "Expense" | "VendorInvoice" | "StripeTransaction"

interface GLEntry {
  id: string
  date: string
  accountType: string
  accountName: string
  description: string
  debit: number
  credit: number
  amount: number
  sourceType: string
  sourceId: string
}

interface SummaryRow {
  accountType: string
  accountName: string
  amount: number
  debit: number
  credit: number
}

interface KPIs {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  accountsReceivable: number
  accountsPayable: number
}

const DATE_PRESETS = [
  { label: "Today", getValue: () => ({ start: format(new Date(), "yyyy-MM-dd"), end: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Last 7 days", getValue: () => ({ start: format(subDays(new Date(), 7), "yyyy-MM-dd"), end: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Last 30 days", getValue: () => ({ start: format(subDays(new Date(), 30), "yyyy-MM-dd"), end: format(new Date(), "yyyy-MM-dd") }) },
  { label: "This month", getValue: () => ({ start: format(startOfMonth(new Date()), "yyyy-MM-dd"), end: format(endOfMonth(new Date()), "yyyy-MM-dd") }) },
  { label: "This year", getValue: () => ({ start: format(startOfYear(new Date()), "yyyy-MM-dd"), end: format(new Date(), "yyyy-MM-dd") }) },
  { label: "All time", getValue: () => ({ start: "", end: "" }) },
]

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  Revenue: "#22c55e",
  Expenses: "#ef4444",
  Assets: "#3b82f6",
  Liabilities: "#f59e0b",
  Equity: "#8b5cf6",
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(value))
}

function getSourceLink(sourceType: string, sourceId: string): string | null {
  const cleanId = sourceId.replace(/-ar$|-tax$|-rev$|-def$|-ap$/, "")
  switch (sourceType) {
    case "Invoice": return `/invoices/${cleanId}`
    case "Expense": return `/expenses/${cleanId}`
    case "VendorInvoice": return `/vendor-invoices/${cleanId}`
    case "StripeTransaction": return `/transactions/${cleanId}`
    default: return null
  }
}

export function GeneralLedgerClient() {
  const [entries, setEntries] = useState<GLEntry[]>([])
  const [summary, setSummary] = useState<SummaryRow[]>([])
  const [kpis, setKpis] = useState<KPIs>({ totalRevenue: 0, totalExpenses: 0, netIncome: 0, accountsReceivable: 0, accountsPayable: 0 })
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [autoSynced, setAutoSynced] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState("Last 30 days")
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [accountType, setAccountType] = useState<AccountType>("All")
  const [sourceType, setSourceType] = useState<SourceType>("All")
  const [accountNameFilter, setAccountNameFilter] = useState("All")
  const [drilldownAccount, setDrilldownAccount] = useState<string | null>(null)

  const uniqueAccountNames = ["All", ...Array.from(new Set(summary.map((s) => s.accountName))).sort()]

  const fetchData = useCallback(async (currentPage = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: "50",
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(accountType !== "All" && { accountType }),
        ...(sourceType !== "All" && { sourceType }),
        ...((drilldownAccount || accountNameFilter !== "All") && { accountName: drilldownAccount ?? accountNameFilter }),
      })
      const res = await fetch(`/api/reports/general-ledger?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setEntries(data.entries)
      setSummary(data.summary)
      setKpis(data.kpis)
      setTotalCount(data.totalCount)
      setTotalPages(data.totalPages)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, accountType, sourceType, accountNameFilter, drilldownAccount])

  useEffect(() => {
    if (!autoSynced) {
      setAutoSynced(true)
      setSyncing(true)
      fetch("/api/reports/general-ledger", { method: "POST" })
        .catch(() => {})
        .finally(() => {
          setSyncing(false)
          fetchData(1)
        })
    }
  }, [])

  useEffect(() => {
    if (!autoSynced) return
    setPage(1)
    fetchData(1)
  }, [startDate, endDate, accountType, sourceType, accountNameFilter, drilldownAccount])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch("/api/reports/general-ledger", { method: "POST" })
      await fetchData(1)
    } finally {
      setSyncing(false)
    }
  }

  const handlePreset = (label: string) => {
    const preset = DATE_PRESETS.find((p) => p.label === label)
    if (!preset) return
    const { start, end } = preset.getValue()
    setSelectedPreset(label)
    setStartDate(start)
    setEndDate(end)
  }

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      format: "csv",
      pageSize: "10000",
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(accountType !== "All" && { accountType }),
      ...(sourceType !== "All" && { sourceType }),
    })
    window.open(`/api/reports/general-ledger?${params}`, "_blank")
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchData(newPage)
  }

  const groupedSummary = summary.reduce<Record<string, SummaryRow[]>>((acc, row) => {
    if (!acc[row.accountType]) acc[row.accountType] = []
    acc[row.accountType].push(row)
    return acc
  }, {})

  const chartData = Object.entries(groupedSummary).map(([type, rows]) => ({
    name: type,
    amount: Math.abs(rows.reduce((s, r) => s + r.amount, 0)),
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">General Ledger</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Unified view of all financial transactions across every module
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Now"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Date Range</label>
          <div className="flex gap-1 flex-wrap">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={selectedPreset === preset.label ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => handlePreset(preset.label)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setSelectedPreset("Custom") }}
              className="h-8 text-sm w-36"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setSelectedPreset("Custom") }}
              className="h-8 text-sm w-36"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Account Type</label>
          <Select value={accountType} onValueChange={(v) => { setAccountType(v as AccountType); setDrilldownAccount(null) }}>
            <SelectTrigger className="h-8 w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All", "Revenue", "Expenses", "Assets", "Liabilities", "Equity"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Source</label>
          <Select value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["All", "Invoice", "Expense", "VendorInvoice", "StripeTransaction"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">Account Name</label>
          <Select value={drilldownAccount ?? accountNameFilter} onValueChange={(v) => { setDrilldownAccount(null); setAccountNameFilter(v) }}>
            <SelectTrigger className="h-8 w-52 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {uniqueAccountNames.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {drilldownAccount && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setDrilldownAccount(null)}>
            ✕ Clear drill-down
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 dark:bg-red-900 p-2">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(kpis.totalExpenses)}</div>
                <div className="text-sm text-muted-foreground">Total Expenses</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${kpis.netIncome >= 0 ? "bg-emerald-100 dark:bg-emerald-900" : "bg-orange-100 dark:bg-orange-900"}`}>
                <DollarSign className={`h-5 w-5 ${kpis.netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${kpis.netIncome >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                  {kpis.netIncome < 0 ? "-" : ""}{formatCurrency(kpis.netIncome)}
                </div>
                <div className="text-sm text-muted-foreground">Net Income</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-semibold">AR: {formatCurrency(kpis.accountsReceivable)}</div>
                <div className="text-sm font-semibold">AP: {formatCurrency(kpis.accountsPayable)}</div>
                <div className="text-xs text-muted-foreground">Receivable / Payable</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Group Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={ACCOUNT_TYPE_COLORS[entry.name] ?? "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Detail Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto">
            {Object.entries(groupedSummary).map(([type, rows]) => (
              <div key={type} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: ACCOUNT_TYPE_COLORS[type] ?? "#6b7280" }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{type}</span>
                </div>
                {rows.map((row) => (
                  <button
                    key={row.accountName}
                    className="flex w-full items-center justify-between py-1 px-2 rounded hover:bg-muted/50 transition-colors text-sm cursor-pointer"
                    onClick={() => setDrilldownAccount(row.accountName)}
                  >
                    <span className="truncate text-left">{row.accountName}</span>
                    <span className={`font-mono text-xs ml-2 ${row.amount < 0 ? "text-red-500" : "text-green-600"}`}>
                      {row.amount < 0 ? "-" : ""}{formatCurrency(row.amount)}
                    </span>
                  </button>
                ))}
              </div>
            ))}
            {summary.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center py-8">No data for selected filters</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              GL Entries
              {drilldownAccount && (
                <Badge variant="secondary" className="ml-2 font-normal">
                  {drilldownAccount}
                </Badge>
              )}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {totalCount.toLocaleString()} entries
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="max-w-xs">Description</TableHead>
                  <TableHead className="text-right w-24">Debit</TableHead>
                  <TableHead className="text-right w-24">Credit</TableHead>
                  <TableHead className="text-right w-24">Amount</TableHead>
                  <TableHead className="w-32">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No entries found. Click "Sync Now" to populate the ledger from all modules.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => {
                    const sourceLink = getSourceLink(entry.sourceType, entry.sourceId)
                    return (
                      <TableRow key={entry.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <button
                              className="text-xs font-medium text-left hover:text-primary hover:underline"
                              onClick={() => setDrilldownAccount(entry.accountName)}
                            >
                              {entry.accountName}
                            </button>
                            <span
                              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium w-fit"
                              style={{
                                backgroundColor: `${ACCOUNT_TYPE_COLORS[entry.accountType] ?? "#6b7280"}22`,
                                color: ACCOUNT_TYPE_COLORS[entry.accountType] ?? "#6b7280",
                              }}
                            >
                              {entry.accountType}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs">
                          <span className="line-clamp-2">{entry.description}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm font-medium ${entry.amount < 0 ? "text-red-500" : "text-green-600"}`}>
                          {entry.amount < 0 ? "-" : ""}{formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">
                              {entry.sourceType.replace("StripeTransaction", "Stripe").replace("VendorInvoice", "Vendor Inv.")}
                            </Badge>
                            {sourceLink && (
                              <Link href={sourceLink} className="text-muted-foreground hover:text-primary">
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
