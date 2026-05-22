"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface AnomalyProps {
  anomaly: any
  onResolve: () => void
}

export function AnomalyCard({ anomaly, onResolve }: AnomalyProps) {
  const [loading, setLoading] = useState(false)

  const handleAction = async (status: string, isFalsePositive = false) => {
    setLoading(true)
    try {
      await fetch("/api/expenses/alert", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: anomaly.id, status, isFalsePositive })
      })
      onResolve()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
      <CardContent className="p-4 flex gap-4 items-start">
        <div className="p-2 bg-destructive/10 rounded-full text-destructive shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold text-destructive uppercase tracking-tight text-sm truncate">
              {anomaly.type.replace('_', ' ')}
            </h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(anomaly.expense.date).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm font-medium mt-1">{anomaly.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] h-5 bg-background/50">
              {anomaly.expense.description}
            </Badge>
            <span className="text-sm font-bold text-destructive">
              ${anomaly.expense.amount}
            </span>
          </div>
          <div className="mt-4 flex gap-2">
            <Button 
              size="sm"
              variant="destructive"
              disabled={loading}
              onClick={() => handleAction('REVIEWED')}
              className="h-8 text-xs"
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Mark Reviewed
            </Button>
            <Button 
              size="sm"
              variant="ghost"
              disabled={loading}
              onClick={() => handleAction('DISMISSED', true)}
              className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              False Positive
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
