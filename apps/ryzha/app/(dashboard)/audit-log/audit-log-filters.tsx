"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const ENTITY_TYPES = [
  "Invoice", "VendorInvoice", "JournalEntry", "PurchaseOrder", "SalesOrder",
  "Payment", "VendorPayment", "Customer", "Vendor", "ChartOfAccounts",
  "AccountingPeriod", "PaymentRun", "Expense", "FixedAsset",
]

const ACTIONS = [
  "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE", "POST", "REVERSE",
  "APPROVE", "REJECT", "VOID", "PERIOD_CLOSE", "PERIOD_REOPEN",
  "PAYMENT_RECORDED", "INVITE_USER",
]

export function AuditLogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={searchParams.get("entityType") ?? "all"}
        onValueChange={(v) => update("entityType", v)}
      >
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue placeholder="Entity type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All entity types</SelectItem>
          {ENTITY_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("action") ?? "all"}
        onValueChange={(v) => update("action", v)}
      >
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All actions</SelectItem>
          {ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="h-8 w-[140px] text-xs"
        value={searchParams.get("from") ?? ""}
        onChange={(e) => update("from", e.target.value)}
        placeholder="From"
      />
      <Input
        type="date"
        className="h-8 w-[140px] text-xs"
        value={searchParams.get("to") ?? ""}
        onChange={(e) => update("to", e.target.value)}
        placeholder="To"
      />
    </div>
  )
}
