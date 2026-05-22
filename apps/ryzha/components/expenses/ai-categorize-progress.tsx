"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, CheckCircle2, Loader2, Sparkles } from "lucide-react"

interface AICategorizeProgressProps {
  isProcessing: boolean
  totalItems: number
  processedItems: number
  onComplete: () => void
}

export function AICategorizeProgress({
  isProcessing,
  totalItems,
  processedItems,
  onComplete
}: AICategorizeProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (totalItems > 0) {
      const p = Math.round((processedItems / totalItems) * 100)
      setProgress(p)
      if (processedItems === totalItems && totalItems > 0) {
        setTimeout(onComplete, 2000)
      }
    }
  }, [processedItems, totalItems, onComplete])

  if (!isProcessing) return null

  return (
    <Card className="mb-8 border-purple-200 bg-purple-50/30 dark:bg-purple-900/10 dark:border-purple-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-full animate-pulse">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                AI Categorization in Progress
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Processing {processedItems} of {totalItems} transactions...
              </p>
            </div>
          </div>
          {progress < 100 ? (
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress}%
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium animate-in zoom-in">
              <CheckCircle2 className="h-4 w-4" />
              Complete!
            </div>
          )}
        </div>
        <Progress value={progress} className="h-2 bg-purple-100 dark:bg-purple-900/20" />
        <div className="mt-4 flex gap-4 overflow-hidden">
          <div className="flex items-center gap-2 whitespace-nowrap text-xs text-purple-600 dark:text-purple-400">
             <Sparkles className="h-3 w-3" />
             Identifying recurring vendors
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap text-xs text-purple-600 dark:text-purple-400 opacity-50">
             <Sparkles className="h-3 w-3" />
             Mapping tax categories
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
