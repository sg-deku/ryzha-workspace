"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  ORDERED: "bg-indigo-100 text-indigo-800",
  RECEIVED: "bg-teal-100 text-teal-800",
  CLOSED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-800",
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

export default function VendorPortalOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acking, setAcking] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch("/api/vendor-portal/orders")
    if (res.status === 401) { router.replace("/vendor-portal/expired"); return }
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const acknowledge = async (poId: string) => {
    setAcking(poId)
    try {
      const res = await fetch("/api/vendor-portal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseOrderId: poId }),
      })
      if (res.ok) {
        toast.success("Purchase order acknowledged")
        load()
      } else {
        toast.error("Failed to acknowledge")
      }
    } finally {
      setAcking(null)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
      {orders.length === 0 && (
        <p className="text-gray-500 text-sm py-8 text-center">No purchase orders found.</p>
      )}
      {orders.map((order) => {
        const acked = order.poAcknowledgments?.length > 0
        return (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{order.poNumber}</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-semibold">{fmt(order.totalAmount)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {order.description && (
                <p className="text-sm text-gray-600">{order.description}</p>
              )}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  {expanded === order.id ? "Hide" : "View"} line items ({order.lineItems?.length || 0})
                </Button>
                {acked ? (
                  <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Acknowledged {new Date(order.poAcknowledgments[0].acknowledgedAt).toLocaleDateString()}
                  </span>
                ) : (
                  ["APPROVED", "ORDERED"].includes(order.status) && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={acking === order.id}
                      onClick={() => acknowledge(order.id)}
                    >
                      Acknowledge Receipt
                    </Button>
                  )
                )}
              </div>
              {expanded === order.id && order.lineItems?.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Description</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">Qty</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">Unit Price</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.lineItems.map((line: any, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2">{line.description}</td>
                          <td className="px-3 py-2 text-right">{line.quantity}</td>
                          <td className="px-3 py-2 text-right">{fmt(line.unitPrice)}</td>
                          <td className="px-3 py-2 text-right font-medium">{fmt(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
