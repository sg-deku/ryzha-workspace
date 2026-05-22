"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface AnomalyCardProps {
  id: string
  expense: any
  reason: string
  onDismiss: (id: string) => void
  onReview: (id: string) => void
}

export function AnomalyCard({ id, expense, reason, onDismiss, onReview }: AnomalyCardProps) {
  return (
    <Card className="bg-red-50/50 border-red-100 shadow-sm relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-900">
              Anomaly Detected: {expense?.vendor || "Unknown Vendor"}
            </p>
            <p className="text-xs text-red-700">{reason || "Unusual expense amount for this category."}</p>
            {expense?.amount && (
              <p className="text-sm font-bold text-red-800">${expense.amount.toFixed(2)}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-100"
            onClick={() => onDismiss(id)}
          >
            <XCircle className="w-4 h-4 mr-1" /> Dismiss
          </Button>
          <Button 
            size="sm" 
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
            onClick={() => onReview(id)}
          >
            <CheckCircle className="w-4 h-4 mr-1" /> Reviewed
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}