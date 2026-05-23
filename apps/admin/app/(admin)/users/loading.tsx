import { Header } from "@/components/layout/header"

export default function UsersLoading() {
  return (
    <>
      <Header title="Users" />
      <div className="flex-1 p-6 space-y-4">
        <div className="rounded-lg border bg-card overflow-hidden animate-pulse">
          <div className="border-b bg-muted/50 px-4 py-3 h-10" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-b px-4 py-4 flex gap-4">
              <div className="h-4 flex-1 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-28 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
