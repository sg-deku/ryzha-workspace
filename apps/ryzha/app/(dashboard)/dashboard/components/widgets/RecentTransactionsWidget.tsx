"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionList } from "@/components/dashboard/transaction-list"
import { useSession } from "next-auth/react"

export function RecentTransactionsWidget() {
  const { data: session } = useSession()
  return (
    <Card className="card-default">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionList orgId={session?.user?.organizationId} />
      </CardContent>
    </Card>
  )
}
