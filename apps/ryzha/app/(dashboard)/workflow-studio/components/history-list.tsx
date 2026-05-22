"use client"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface HistoryItem {
  id: string
  type: string
  startedAt: string
  status: string
}

export function HistoryList({ onSelect }: { onSelect: (id: string) => void }) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/workflow-studio/history")
      .then(res => res.json())
      .then(data => {
        setHistory(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Execution History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Execution ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">Loading history...</TableCell>
              </TableRow>
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">No execution history found.</TableCell>
              </TableRow>
            ) : (
              history.map(item => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(item.id)}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell className="capitalize">{item.type}</TableCell>
                  <TableCell>{new Date(item.startedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "COMPLETED" ? "default" : item.status === "ERROR" ? "destructive" : "secondary"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
