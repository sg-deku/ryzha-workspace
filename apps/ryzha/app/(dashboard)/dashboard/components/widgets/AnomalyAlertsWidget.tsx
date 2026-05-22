"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardAlerts } from "../../dashboard-alerts"

export function AnomalyAlertsWidget() {
  return (
    <Card className="card-default">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Expense Anomalies & Audit Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <DashboardAlerts />
      </CardContent>
    </Card>
  )
}
