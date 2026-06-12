export default function StagingLoading() {
  return (
    <div className="space-y-5">
      <div>
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse mt-2" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-7 w-20 bg-muted rounded-full animate-pulse" />
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden animate-pulse">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["Event", "Source", "Amount", "Status", "AI Decision", "When", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-36" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-16" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-20 ml-auto" /></td>
                <td className="px-4 py-3"><div className="h-5 bg-muted rounded-full w-24" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-28" /></td>
                <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-14" /></td>
                <td className="px-4 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
