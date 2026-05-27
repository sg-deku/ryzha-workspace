"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const ACCOUNT_TYPES = ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"]

interface CoaFormProps {
  mode: "create" | "edit"
  accountId?: string
  defaultValues?: {
    accountCode?: string | null
    accountName?: string
    accountType?: string
    categoryMatch?: string | null
    parentId?: string | null
  }
  parentOptions: { id: string; accountName: string; accountType: string }[]
}

export function CoaForm({ mode, accountId, defaultValues, parentOptions }: CoaFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState(defaultValues?.accountType ?? "Assets")

  const sameTypeParents = parentOptions.filter((p) => p.accountType === accountType)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const data = {
      accountCode: (form.elements.namedItem("accountCode") as HTMLInputElement).value.trim() || null,
      accountName: (form.elements.namedItem("accountName") as HTMLInputElement).value.trim(),
      accountType,
      categoryMatch: (form.elements.namedItem("categoryMatch") as HTMLInputElement).value.trim() || null,
      parentId: (form.elements.namedItem("parentId") as HTMLSelectElement).value || null,
    }

    try {
      const url = mode === "create" ? "/api/chart-of-accounts" : `/api/chart-of-accounts/${accountId}`
      const method = mode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to save")

      toast.success(mode === "create" ? "Account created" : "Account updated")
      router.push("/chart-of-accounts")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{mode === "create" ? "New Account" : "Edit Account"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="accountType">Account Type</Label>
            <select
              id="accountType"
              name="accountType"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accountCode">Account Code <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="accountCode"
              name="accountCode"
              placeholder="e.g. 1000"
              defaultValue={defaultValues?.accountCode ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              name="accountName"
              placeholder="e.g. Cash and Cash Equivalents"
              defaultValue={defaultValues?.accountName ?? ""}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoryMatch">Category Match <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="categoryMatch"
              name="categoryMatch"
              placeholder="e.g. travel, software, payroll"
              defaultValue={defaultValues?.categoryMatch ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Used to auto-map expense categories to this account.
            </p>
          </div>

          {sameTypeParents.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="parentId">Parent Account <span className="text-muted-foreground">(optional)</span></Label>
              <select
                id="parentId"
                name="parentId"
                defaultValue={defaultValues?.parentId ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">— None (top-level) —</option>
                {sameTypeParents.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === accountId}>
                    {p.accountName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : mode === "create" ? "Create Account" : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
