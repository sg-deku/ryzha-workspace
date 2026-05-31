"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

export default function VendorPortalPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/vendor-portal/payments").then(async (res) => {
      if (res.status === 401) { router.replace("/vendor-portal/expired"); return }
      if (res.ok) setPayments(await res.json())
      setLoading(false)
    })
  }, [router])

  if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>

  const total = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
        {payments.length > 0 && (
          <p className="text-sm text-gray-500">Total received: <span className="font-semibold text-gray-900">{fmt(total)}</span></p>
        )}
      </div>
      {payments.length === 0 && (
        <p className="text-gray-500 text-sm py-8 text-center">No payments recorded yet.</p>
      )}
      {payments.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-600">{p.vendorInvoice?.invoiceNumber ?? "—"}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{p.method?.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.referenceNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
