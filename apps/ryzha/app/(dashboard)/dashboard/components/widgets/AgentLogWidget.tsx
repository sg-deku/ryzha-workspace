"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

export function AgentLogWidget() {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Agent Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityFeed />
      </CardContent>
    </Card>
  )
}
