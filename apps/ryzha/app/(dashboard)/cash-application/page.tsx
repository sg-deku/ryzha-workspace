import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, CheckCircle2, Search } from "lucide-react"


export const dynamic = "force-dynamic";

export default async function CashApplicationPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  // Mock data for unapplied payments
  const unappliedPayments = [
    { id: "1", customer: "Acme Corp", amount: 1200, date: new Date(), ref: "STRIPE-942", matchConfidence: 0.95 },
    { id: "2", customer: "Global Tech", amount: 500, date: new Date(), ref: "WIRE-882", matchConfidence: 0.82 },
    { id: "3", customer: "Unknown", amount: 2400, date: new Date(), ref: "CHECK-102", matchConfidence: 0.15 },
  ]

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cash Application</h2>
        <Button variant="outline" className="gap-2">
          <Brain className="h-4 w-4 text-primary" /> Run AI Matcher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unapplied Payments</CardTitle>
          <CardDescription>Match incoming payments to outstanding sales orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer (Detected)</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Match Confidence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unappliedPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">{payment.ref}</TableCell>
                  <TableCell className="font-medium">{payment.customer}</TableCell>
                  <TableCell>${payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{payment.date.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${payment.matchConfidence > 0.8 ? "bg-green-500" : payment.matchConfidence > 0.5 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${payment.matchConfidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{(payment.matchConfidence * 100).toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Search className="h-3 w-3" /> Manual Match
                      </Button>
                      <Button size="sm" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Approve Match
                      </Button>
                    </div>
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
