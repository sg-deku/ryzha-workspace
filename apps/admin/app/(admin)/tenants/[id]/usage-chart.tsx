"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DataPoint {
  date: string
  apiCalls: number
  aiTokens: number
}

export function UsageChart({ data }: { data: DataPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Usage Over Time (last 30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="apiCalls" stroke="#3b82f6" name="API Calls" dot={false} />
            <Line type="monotone" dataKey="aiTokens" stroke="#8b5cf6" name="AI Tokens" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
