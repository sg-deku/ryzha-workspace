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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {reports.map((report) => (
        <Link key={report.title} href={report.href} className="block group">
          <Card className="h-full hover:shadow-md transition-all border hover:border-primary/50 cursor-pointer">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${report.bgColor} ${report.color}`}>
                  <report.icon className="h-5 w-5" />
                </div>
                {report.status && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded text-muted-foreground">
                    {report.status}
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all mt-1" />
              </div>
              <div className="space-y-1 mt-2">
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{report.description}</CardDescription>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
