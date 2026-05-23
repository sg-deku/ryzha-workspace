import { Header } from "@/components/layout/header"

export default function DashboardLoading() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-4" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
