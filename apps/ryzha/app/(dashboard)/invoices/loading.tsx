import { SkeletonTable } from "@/components/ui/skeleton-table"

export default function Loading() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      <div className="bg-white border rounded shadow-sm overflow-hidden p-6">
        <SkeletonTable />
      </div>
    </div>
  )
}
