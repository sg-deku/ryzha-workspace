"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, FileText, CreditCard, Clock } from "lucide-react"

export default function VendorPortalDashboardPage() {
  const router = useRouter()
  const [vendor, setVendor] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [meRes, ordRes, invRes, payRes] = await Promise.all([
        fetch("/api/vendor-portal/me"),
        fetch("/api/vendor-portal/orders"),
        fetch("/api/vendor-portal/invoices"),
        fetch("/api/vendor-portal/payments"),
      ])
      if (meRes.status === 401) { router.replace("/vendor-portal/expired"); return }
      if (meRes.ok) setVendor(await meRes.json())
      if (ordRes.ok) setOrders(await ordRes.json())
      if (invRes.ok) setInvoices(await invRes.json())
      if (payRes.ok) setPayments(await payRes.json())
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>

  const openInvoices = invoices.filter((i) => !["PAID", "CANCELLED"].includes(i.status))
  const totalPayments = payments.reduce((s: number, p: any) => s + p.amount, 0)
  const pendingOrders = orders.filter((o) => ["APPROVED", "ORDERED"].includes(o.status))
  const fmt = (n: number, c = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {vendor?.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {vendor?.organization?.name} Vendor Portal
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-blue-500 bg-blue-50 rounded-lg p-1.5" />
              <div>
                <p className="text-xs text-gray-500">Active Orders</p>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500 bg-yellow-50 rounded-lg p-1.5" />
              <div>
                <p className="text-xs text-gray-500">Open Invoices</p>
                <p className="text-2xl font-bold">{openInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-500 bg-purple-50 rounded-lg p-1.5" />
              <div>
                <p className="text-xs text-gray-500">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-green-500 bg-green-50 rounded-lg p-1.5" />
              <div>
                <p className="text-xs text-gray-500">Total Received</p>
                <p className="text-lg font-bold">{fmt(totalPayments)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingOrders.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Active Purchase Orders</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-600">PO #</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{o.poNumber}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{fmt(o.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {openInvoices.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Outstanding Invoices</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Invoice #</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Due Date</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {openInvoices.slice(0, 5).map((i) => (
                    <tr key={i.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{i.invoiceNumber}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {new Date(i.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                          {i.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{fmt(i.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
