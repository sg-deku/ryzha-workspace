"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, AlertTriangle } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function TaxReportPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1)
  const [jurisdiction, setJurisdiction] = useState("")
  const [taxRate, setTaxRate] = useState("")
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    const startDate = new Date(year, (quarter - 1) * 3, 1).toISOString()
    const endDate = new Date(year, quarter * 3, 0).toISOString()
    
    let url = `/api/reports/tax?startDate=${startDate}&endDate=${endDate}`
    if (jurisdiction) url += `&jurisdiction=${jurisdiction}`
    if (taxRate) url += `&taxRate=${taxRate}`
    
    try {
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [year, quarter, jurisdiction, taxRate])

  const getExportUrl = (type: 'csv' | 'pdf') => {
    const startDate = new Date(year, (quarter - 1) * 3, 1).toISOString()
    const endDate = new Date(year, quarter * 3, 0).toISOString()
    let url = `/api/reports/tax/export${type === 'pdf' ? '-pdf' : ''}?startDate=${startDate}&endDate=${endDate}`
    if (jurisdiction) url += `&jurisdiction=${jurisdiction}`
    if (taxRate) url += `&taxRate=${taxRate}`
    return url
  }

  const handleExportCSV = () => window.open(getExportUrl('csv'))
  const handleExportPDF = () => window.open(getExportUrl('pdf'))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Report</h1>
          <p className="text-muted-foreground">Comprehensive tax reporting and compliance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {report?.safeHarborWarning && (
        <Card className="bg-amber-50 border-amber-200 text-amber-900">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="font-medium text-sm">{report.safeHarborWarning}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Adjust the parameters below to filter your tax report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quarter</label>
              <Select value={quarter.toString()} onValueChange={(v) => setQuarter(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1 (Jan - Mar)</SelectItem>
                  <SelectItem value="2">Q2 (Apr - Jun)</SelectItem>
                  <SelectItem value="3">Q3 (Jul - Sep)</SelectItem>
                  <SelectItem value="4">Q4 (Oct - Dec)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Jurisdiction (ISO)</label>
              <Input 
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value.toUpperCase())}
                placeholder="e.g. DE, NY"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax Rate %</label>
              <Input 
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="e.g. 19"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : report ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(report.totalSales)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tax Collected</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(report.totalTaxCollected)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Deductible Tax</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(report.totalDeductibleTax)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Net Tax Owed</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(report.netOwed)}
                </p>
              </CardContent>
            </Card>
          </div>

          {Object.keys(report.salesByRate).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sales by Tax Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(report.salesByRate).map(([rate, data]: [string, any]) => (
                    <div key={rate} className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm font-semibold">{rate}% Rate</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">Sales: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.sales)}</p>
                        <p className="text-xs text-muted-foreground">Tax: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.tax)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Transaction Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right pr-6">Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.details.map((row: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6">{new Date(row.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{row.reference}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                          {row.jurisdiction}
                        </span>
                      </TableCell>
                      <TableCell>{row.rate}%</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.amount)}
                      </TableCell>
                      <TableCell className="text-right pr-6 font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.tax)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
