"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-gray-100 text-gray-700",
  MATCHED: "bg-blue-100 text-blue-800",
  APPROVED: "bg-teal-100 text-teal-800",
  PAID: "bg-green-100 text-green-800",
  DISPUTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

export default function VendorPortalInvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/vendor-portal/invoices").then(async (res) => {
      if (res.status === 401) { router.replace("/vendor-portal/expired"); return }
      if (res.ok) setInvoices(await res.json())
      setLoading(false)
    })
  }, [router])

  if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
      {invoices.length === 0 && (
        <p className="text-gray-500 text-sm py-8 text-center">No invoices found.</p>
      )}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Issue Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(inv.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
