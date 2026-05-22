"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuditSeal } from "./audit-seal"
import Link from "next/link"

interface Transaction {
  id: string
  amount: number
  description: string | null
  auditStatus: string
  auditHash: string | null
  workflowStatus: string
  createdAt: string
}

export function TransactionList({ orgId }: { orgId: string | undefined }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const fetchTransactions = async () => {
    if (!orgId) return
    try {
      const res = await fetch(`/api/transactions?orgId=${orgId}`)
      if (res.ok) {
        setTransactions(await res.json())
      }
    } catch (err) {
      console.error("Failed to fetch transactions", err)
    }
  }

  useEffect(() => {
    fetchTransactions()

    // Refresh when a workflow completes
    if (!orgId) return
    const eventSource = new EventSource(`/api/events?orgId=${orgId}`)
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "workflow_completed") {
        fetchTransactions()
      }
    }

    return () => eventSource.close()
  }, [orgId])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Reconciled Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No reconciled transactions found.
          </p>
        )}
        {transactions.map((tx) => (
          <Link href={`/transactions/${tx.id}`} key={tx.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/10 transition-colors cursor-pointer">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <Badge variant={tx.workflowStatus === "completed" ? "default" : "secondary"}>
                  {tx.workflowStatus}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{tx.description || "No description"}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <AuditSeal hash={tx.auditHash || ""} status={tx.auditStatus} />
              <span className="text-[10px] text-muted-foreground">
                {new Date(tx.createdAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
