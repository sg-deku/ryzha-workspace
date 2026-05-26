"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, RefreshCw, Mail } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export default function FinancialDigestReportPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/reports/financial-digest/generate", {
        method: "POST"
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Financial Digest</h2>
            <p className="text-muted-foreground">Executive summary of financial health</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Re-generate
          </Button>
          <Button disabled={loading}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid gap-6">
          <Skeleton className="h-[200px] w-full" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      ) : data ? (
        <div className="grid gap-6">
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">Executive Summary - AI Insights</CardTitle>
              <CardDescription className="text-indigo-100">Generated on {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.narrative?.map((paragraph: string, i: number) => (
                <p key={i} className="text-lg leading-relaxed">{paragraph}</p>
              ))}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border-b">
                    <span className="text-muted-foreground font-medium">Monthly Recurring Revenue (MRR)</span>
                    <span className="text-lg font-bold">{data.mrr}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border-b">
                    <span className="text-muted-foreground font-medium">Cash Balance</span>
                    <span className="text-lg font-bold">{data.cashBalance}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border-b">
                    <span className="text-muted-foreground font-medium">Total Expenses</span>
                    <span className="text-lg font-bold">{data.totalExpenses}</span>
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span className="text-muted-foreground font-medium">Outstanding Invoices</span>
                    <span className="text-lg font-bold">{data.outstandingInvoices}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit & Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg border ${
                  data.complianceStatus === 'Met' 
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
                }`}>
                  <h4 className={`font-semibold mb-1 ${
                    data.complianceStatus === 'Met'
                      ? 'text-green-800 dark:text-green-400'
                      : 'text-orange-800 dark:text-orange-400'
                  }`}>
                    ASC 606 Compliance: {data.complianceStatus}
                  </h4>
                  <p className={`text-sm ${
                    data.complianceStatus === 'Met'
                      ? 'text-green-700 dark:text-green-500'
                      : 'text-orange-700 dark:text-orange-500'
                  }`}>
                    {data.complianceMessage}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-1">Pending Actions</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-500">{data.pendingActions}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center p-12 text-muted-foreground">Failed to load report data.</div>
      )}
    </div>
  )
}
