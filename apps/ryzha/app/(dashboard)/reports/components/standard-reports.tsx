import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, PieChart, TrendingUp, Landmark, ArrowRight, BarChart3, BookOpen } from "lucide-react"

export function StandardReports() {
  const reports: any[] = [
    {
      title: "Tax Report",
      description: "Detailed breakdown of sales tax collected and deductible expenses.",
      href: "/reports/tax",
      icon: Landmark,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Cash Flow",
      description: "Analyze your income and expenses over time to understand liquidity.",
      href: "/reports/cash-flow",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Expense Categories",
      description: "Distribution of spending across different business categories.",
      href: "/reports/expense-categories",
      icon: PieChart,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Financial Digest",
      description: "Monthly summary of organization-wide financial performance.",
      href: "/reports/financial-digest",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Profit & Loss",
      description: "Real-time and monthly P&L with revenue, expenses, net income, and gross margin.",
      href: "/reports/profit-loss",
      icon: BarChart3,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "General Ledger",
      description: "Unified ledger of all transactions across invoices, expenses, vendors, and Stripe.",
      href: "/reports/general-ledger",
      icon: BookOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reports.map((report) => (
        <Card key={report.title} className="group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className={`p-3 rounded-xl ${report.bgColor} ${report.color}`}>
              <report.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{report.title}</CardTitle>
                {report.status && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded text-muted-foreground">
                    {report.status}
                  </span>
                )}
              </div>
              <CardDescription className="mt-1">{report.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant={report.status ? "outline" : "default"}
              className="w-full"
              asChild={!report.status}
              disabled={!!report.status}
            >
              {report.status ? (
                "Unavailable"
              ) : (
                <Link href={report.href} className="flex items-center justify-center w-full">
                  View Report
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
