"use client"

import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

export function BalanceSheetDatePicker({ currentAsOf }: { currentAsOf?: string }) {
  const router = useRouter()
  const defaultValue = currentAsOf ?? format(new Date(), "yyyy-MM-dd")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (val) {
      router.push(`/reports/balance-sheet?asOf=${val}`)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="asOf" className="text-sm text-muted-foreground whitespace-nowrap">
        As of date
      </Label>
      <Input
        id="asOf"
        type="date"
        defaultValue={defaultValue}
        onChange={handleChange}
        className="w-40 text-sm"
      />
    </div>
  )
}
