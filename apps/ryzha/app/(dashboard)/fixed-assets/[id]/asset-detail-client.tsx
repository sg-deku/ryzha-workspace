"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function FixedAssetDetailClient({ id }: { id: string }) {
  const [asset, setAsset] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/fixed-assets/${id}`)
      .then(r => r.json())
      .then(d => setAsset(d))
      .catch(() => toast.error("Failed to load asset"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!asset || asset.error) return <div className="py-12 text-center text-muted-foreground">Asset not found.</div>

  const schedule = asset.depreciationSchedule ?? []
  const pctDepreciated = asset.acquisitionCost > 0
    ? Math.min(100, Math.round((asset.accumulatedDepreciation / (asset.acquisitionCost - (asset.salvageValue ?? 0))) * 100))
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/fixed-assets"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
            <Badge variant="outline" className="font-mono">{asset.assetNumber}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{asset.category} · {asset.depreciationMethod === "DOUBLE_DECLINING" ? "Double Declining Balance" : "Straight-Line"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Acquisition Cost", value: fmt(asset.acquisitionCost) },
          { label: "Accumulated Depr.", value: fmt(asset.accumulatedDepreciation) },
          { label: "Book Value", value: fmt(asset.currentBookValue) },
          { label: "% Depreciated", value: `${pctDepreciated}%` },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Asset Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Acquisition Date", new Date(asset.acquisitionDate).toLocaleDateString()],
              ["Salvage Value", fmt(asset.salvageValue)],
              ["Useful Life", `${asset.usefulLifeMonths} months`],
              ["Status", asset.status.replace("_", " ")],
              ["GL Asset Account", asset.glAssetAccount],
              ["GL Depr. Expense", asset.glDepreciationAccount],
              ["GL Accum. Depr.", asset.glAccumulatedAccount],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Depreciation Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{pctDepreciated}% depreciated</span>
                <span>100%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pctDepreciated}%` }} />
              </div>
            </div>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Total scheduled periods</span>
                <span className="font-medium text-foreground">{schedule.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Posted periods</span>
                <span className="font-medium text-foreground">{schedule.filter((r: any) => r.posted).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining periods</span>
                <span className="font-medium text-foreground">{schedule.filter((r: any) => !r.posted).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Depreciation Schedule</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Period</TableHead>
                <TableHead>Scheduled Amount</TableHead>
                <TableHead>Actual Amount</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="pr-6">Posted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-muted-foreground italic">No depreciation schedule found.</TableCell>
                </TableRow>
              ) : schedule.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-6 font-medium">
                    {new Date(row.period).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>{fmt(row.scheduledAmount)}</TableCell>
                  <TableCell>{row.actualAmount != null ? fmt(row.actualAmount) : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {row.posted
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : <span className="text-muted-foreground text-xs">Pending</span>
                    }
                  </TableCell>
                  <TableCell className="pr-6 text-muted-foreground text-xs">
                    {row.postedAt ? new Date(row.postedAt).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
