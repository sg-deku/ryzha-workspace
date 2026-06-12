"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "INGESTED", label: "Ingested" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUSHING", label: "Pushing" },
  { value: "POSTED", label: "Posted" },
  { value: "FAILED", label: "Failed" },
  { value: "SKIPPED", label: "Skipped" },
]

export function StagingFilterBar({ sources }: { sources: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get("status") ?? ""
  const currentSource = searchParams.get("source") ?? ""

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setParam("status", opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              currentStatus === opt.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {sources.length > 0 && (
        <select
          className="text-xs rounded-md border bg-background px-3 py-1.5 ml-auto cursor-pointer"
          value={currentSource}
          onChange={(e) => setParam("source", e.target.value)}
        >
          <option value="">All platforms</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
