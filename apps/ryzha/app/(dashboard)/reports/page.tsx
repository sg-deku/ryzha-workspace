export const dynamic = "force-dynamic"

import { StandardReports } from "./components/standard-reports"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Financial insights for your organization</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/reports/settings">
            <Settings className="mr-2 h-4 w-4" />
            Report Settings
          </Link>
        </Button>
      </div>
      <StandardReports />
    </div>
  )
}
