export const dynamic = "force-dynamic"

import { StandardReports } from "./components/standard-reports"

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">Financial insights for your organization</p>
      </div>
      <StandardReports />
    </div>
  )
}
