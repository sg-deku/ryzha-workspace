"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, RefreshCw, Mail } from "lucide-react"
import Link from "next/link"

export default function FinancialDigestReportPage() {
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
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Re-generate
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Executive Summary - AI Insights</CardTitle>
            <CardDescription className="text-indigo-100">Generated on {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg leading-relaxed">
              The organization is currently operating with a healthy margin. Revenue for the period has increased by 12.5% compared to the previous period, largely driven by subscription renewals and new enterprise contracts.
            </p>
            <p className="text-lg leading-relaxed">
              Cash runway extends beyond 14 months at current burn rates. We recommend evaluating early payment discounts on vendor invoices (P2P module) to further optimize working capital.
            </p>
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
                  <span className="text-lg font-bold text-green-600">$12,450 (+12.5%)</span>
                </div>
                <div className="flex justify-between items-center p-3 border-b">
                  <span className="text-muted-foreground font-medium">Cash Balance</span>
                  <span className="text-lg font-bold text-green-600">$45,231 (+5.2%)</span>
                </div>
                <div className="flex justify-between items-center p-3 border-b">
                  <span className="text-muted-foreground font-medium">Total Expenses</span>
                  <span className="text-lg font-bold text-red-600">$3,120 (+1.2%)</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-muted-foreground font-medium">Outstanding Invoices</span>
                  <span className="text-lg font-bold text-blue-600">$8,200 (-2.4%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-400 mb-1">ASC 606 Compliance: Met</h4>
                <p className="text-sm text-green-700 dark:text-green-500">All recognized revenue strictly follows current deferral and realization rules defined in the Financial Engine.</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
                <h4 className="font-semibold text-orange-800 dark:text-orange-400 mb-1">Pending Actions</h4>
                <p className="text-sm text-orange-700 dark:text-orange-500">There are 3 purchase orders pending approval, and 2 disputed sales invoices that require attention.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
