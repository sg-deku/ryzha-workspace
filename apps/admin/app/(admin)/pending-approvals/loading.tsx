import { Header } from "@/components/layout/header"

export default function PendingApprovalsLoading() {
  return (
    <>
      <Header title="Pending Approvals" />
      <div className="flex-1 p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 animate-pulse space-y-3">
            <div className="h-5 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
        ))}
      </div>
    </>
  )
}
