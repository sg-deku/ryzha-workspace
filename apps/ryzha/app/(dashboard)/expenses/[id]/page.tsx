import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"


export const dynamic = "force-dynamic";

export default async function ExpenseDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    return notFound()
  }

  const expense = await prisma.expense.findUnique({
    where: {
      id: params.id,
      organizationId: session.user.organizationId,
    },
    include: {
      anomalies: true,
    }
  })

  if (!expense) {
    return notFound()
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/expenses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Details</h1>
          <p className="text-muted-foreground">View details for {expense.id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-default">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-lg">{expense.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(expense.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p>{format(expense.date, "PPP")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={
                  expense.status === 'REVIEWED' ? 'success' : 
                  expense.status === 'CATEGORIZED' ? 'default' :
                  'secondary'
                } className="mt-1 capitalize">
                  {expense.status.toLowerCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              {expense.category ? (
                <Badge variant="outline" className="mt-1">{expense.category}</Badge>
              ) : (
                <p className="text-sm italic">Uncategorized</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="card-default">
          <CardHeader>
            <CardTitle>AI Insights & Anomalies</CardTitle>
            <CardDescription>Detected by the Auditor agent</CardDescription>
          </CardHeader>
          <CardContent>
            {expense.anomalies.length > 0 ? (
              <ul className="space-y-4">
                {expense.anomalies.map(anomaly => (
                  <li key={anomaly.id} className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20 text-sm">
                    <strong>{anomaly.description}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                No anomalies detected for this expense.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Ensure the icon is imported
import { CheckCircle2 } from "lucide-react"