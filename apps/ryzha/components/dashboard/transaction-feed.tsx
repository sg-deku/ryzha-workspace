"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal, CheckCircle2, AlertCircle } from "lucide-react"

interface AgentLog {
  agent: string
  message: string
  timestamp: string
}

interface TransactionFeedProps {
  orgId: string | undefined
}

export function TransactionFeed({ orgId }: TransactionFeedProps) {
  const [logs, setLogs] = useState<AgentLog[]>([])

  useEffect(() => {
    if (!orgId) return

    const eventSource = new EventSource(`/api/events?orgId=${orgId}`)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "agent_log") {
        setLogs((prev) => [{
          agent: data.agent,
          message: data.message,
          timestamp: new Date(data.timestamp).toLocaleTimeString()
        }, ...prev].slice(0, 50))
      }
    }

    return () => {
      eventSource.close()
    }
  }, [orgId])

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Financial Engine Logs</CardTitle>
        <Terminal className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-4">
          <div className="space-y-4">
            {logs.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                No active agent workflows...
              </p>
            )}
            {logs.map((log, i) => (
              <div key={i} className="flex flex-col gap-1 border-l-2 border-primary/20 pl-3 py-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold px-1 py-0 h-4">
                    {log.agent}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{log.timestamp}</span>
                </div>
                <p className="text-xs font-mono break-words">{log.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
