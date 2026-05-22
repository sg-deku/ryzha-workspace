"use client"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkflowGraph } from "./components/workflow-graph"
import { ManualTriggerPanel } from "./components/manual-trigger-panel"
import { LiveExecutionView } from "./components/live-execution-view"
import { HistoryList } from "./components/history-list"

export default function WorkflowStudioPage() {
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("trigger")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflow Studio</h1>
        <p className="text-muted-foreground">Test, debug, and manually trigger agent workflows</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="trigger">Manual Trigger</TabsTrigger>
          <TabsTrigger value="graph">Agent Graph</TabsTrigger>
          <TabsTrigger value="live">Live Execution</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="trigger">
          <ManualTriggerPanel onTrigger={(executionId) => {
            setActiveExecutionId(executionId)
            setActiveTab("live")
          }} />
        </TabsContent>

        <TabsContent value="graph" className="h-[600px]">
          <WorkflowGraph />
        </TabsContent>

        <TabsContent value="live">
          <LiveExecutionView executionId={activeExecutionId} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryList onSelect={(executionId) => {
            setActiveExecutionId(executionId)
            setActiveTab("live")
          }} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
