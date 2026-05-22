import { SkeletonCard } from "@/components/ui/skeleton-card"

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-4">
        <SkeletonCard />
      </div>
    </div>
  )
}
