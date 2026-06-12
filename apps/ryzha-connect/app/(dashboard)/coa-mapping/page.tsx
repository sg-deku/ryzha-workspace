"use client"

import * as React from "react"
import { BookOpen, RefreshCw, CheckCircle2, XCircle, Search, Pencil } from "lucide-react"

interface COAMapping {
  id: string
  externalCode: string
  externalName: string
  accountType: string
  accountSubType: string | null
  ryzhaCategoryHint: string | null
  isActive: boolean
  usageCount: number
  lastUsedAt: string | null
  integrationConnection: { provider: string }
}

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  Income:          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  Expense:         "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  Asset:           "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  Liability:       "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
  Equity:          "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  "Cost of Goods Sold": "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
}

function TypeBadge({ type }: { type: string }) {
  const cls = ACCOUNT_TYPE_COLORS[type] ?? "bg-muted text-muted-foreground"
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {type}
    </span>
  )
}

function EditModal({
  mapping,
  onClose,
  onSave,
}: {
  mapping: COAMapping
  onClose: () => void
  onSave: (id: string, hint: string) => Promise<void>
}) {
  const [hint, setHint] = React.useState(mapping.ryzhaCategoryHint ?? "")
  const [saving, setSaving] = React.useState(false)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="font-semibold">{mapping.externalCode} - {mapping.externalName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{mapping.accountType}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">AI Category Hint</label>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g. SaaS Revenue, AWS Infrastructure, Marketing Spend"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-xs text-muted-foreground">
            This hint guides the GL Coding agent when auto-assigning this account to matching events.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={async () => {
              setSaving(true)
              await onSave(mapping.id, hint)
              setSaving(false)
              onClose()
            }}
            disabled={saving}
            className="flex-1 rounded-lg bg-primary text-primary-foreground text-sm font-medium py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border text-sm py-2 hover:bg-muted transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function COAMappingPage() {
  const [mappings, setMappings] = React.useState<COAMapping[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [editing, setEditing] = React.useState<COAMapping | null>(null)

  const fetchMappings = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/coa-mappings")
      if (res.ok) {
        const data = await res.json()
        setMappings(data.mappings ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchMappings() }, [fetchMappings])

  async function toggleActive(id: string, isActive: boolean) {
    await fetch("/api/coa-mappings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    })
    setMappings((prev) => prev.map((m) => m.id === id ? { ...m, isActive } : m))
  }

  async function saveHint(id: string, ryzhaCategoryHint: string) {
    await fetch("/api/coa-mappings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ryzhaCategoryHint }),
    })
    setMappings((prev) => prev.map((m) => m.id === id ? { ...m, ryzhaCategoryHint } : m))
  }

  const accountTypes = ["all", ...Array.from(new Set(mappings.map((m) => m.accountType))).sort()]

  const filtered = mappings.filter((m) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || m.externalCode.toLowerCase().includes(q) || m.externalName.toLowerCase().includes(q) || (m.ryzhaCategoryHint ?? "").toLowerCase().includes(q)
    const matchesType = typeFilter === "all" || m.accountType === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Chart of Accounts</h2>
          <p className="text-muted-foreground text-sm mt-1">
            GL accounts synced from QuickBooks. Add AI category hints to guide the GL Coding agent.
          </p>
        </div>
        <button
          onClick={fetchMappings}
          disabled={loading}
          className="flex items-center gap-2 text-sm border rounded-lg px-4 py-2 hover:bg-muted transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {accountTypes.map((t) => (
            <option key={t} value={t}>{t === "all" ? "All types" : t}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 animate-pulse">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-5 w-20 bg-muted rounded-full ml-auto" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border bg-card">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {mappings.length === 0 ? "No accounts synced yet" : "No accounts match your filters"}
          </p>
          {mappings.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Connect QuickBooks and sync your Chart of Accounts to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Hint</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Uses</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((m) => (
                  <tr key={m.id} className={`hover:bg-muted/20 transition-colors ${!m.isActive ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {m.externalCode}
                    </td>
                    <td className="px-4 py-3 font-medium">{m.externalName}</td>
                    <td className="px-4 py-3">
                      <TypeBadge type={m.accountType} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditing(m)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        {m.ryzhaCategoryHint ? (
                          <span className="truncate max-w-[180px]">{m.ryzhaCategoryHint}</span>
                        ) : (
                          <span className="italic">Add hint</span>
                        )}
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{m.usageCount}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => toggleActive(m.id, !m.isActive)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${m.isActive ? "text-emerald-600 hover:text-red-500" : "text-muted-foreground hover:text-emerald-600"}`}
                      >
                        {m.isActive ? (
                          <><CheckCircle2 className="h-3.5 w-3.5" /> Active</>
                        ) : (
                          <><XCircle className="h-3.5 w-3.5" /> Inactive</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            {filtered.length} of {mappings.length} accounts
          </div>
        </div>
      )}

      {editing && (
        <EditModal
          mapping={editing}
          onClose={() => setEditing(null)}
          onSave={saveHint}
        />
      )}
    </div>
  )
}
