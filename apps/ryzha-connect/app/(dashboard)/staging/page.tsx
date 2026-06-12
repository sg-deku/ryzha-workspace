import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { formatCurrency, formatRelative } from "@/lib/utils"
import { StagingFilterBar } from "@/components/staging/filter-bar"
import { PushToQBButton } from "@/components/staging/push-to-qb-button"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"
import { InboxIcon } from "lucide-react"
import { Suspense } from "react"

type SearchParams = { status?: string; source?: string; page?: string }

const STATUS_BADGE: Record<string, string> = {
  INGESTED:         "badge-info",
  PROCESSING:       "badge-warning",
  PENDING_APPROVAL: "badge-warning",
  APPROVED:         "badge-sky",
  PUSHING:          "badge-purple",
  POSTED:           "badge-success",
  FAILED:           "badge-error",
  SKIPPED:          "badge-neutral",
}

const PAGE_SIZE = 25

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? "badge-neutral"
  return <span className={cls}>{status.replace(/_/g, " ")}</span>
}

function TableSkeleton() {
  return (
    <div className="card-default overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["Event", "Source", "Amount", "Status", "AI Decision", "When", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3.5"><div className="h-3.5 animate-shimmer rounded w-32" /></td>
                <td className="px-4 py-3.5"><div className="h-3.5 animate-shimmer rounded w-16" /></td>
                <td className="px-4 py-3.5"><div className="h-3.5 animate-shimmer rounded w-20 ml-auto" /></td>
                <td className="px-4 py-3.5"><div className="h-5 animate-shimmer rounded-full w-20" /></td>
                <td className="px-4 py-3.5"><div className="h-3.5 animate-shimmer rounded w-24" /></td>
                <td className="px-4 py-3.5"><div className="h-3.5 animate-shimmer rounded w-14" /></td>
                <td className="px-4 py-3.5" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

async function EventsTable({
  organizationId,
  status,
  source,
  page,
}: {
  organizationId: string
  status?: string
  source?: string
  page: number
}) {
  const where = {
    organizationId,
    ...(status ? { status: status as any } : {}),
    ...(source ? { source } : {}),
  }

  const [events, total] = await Promise.all([
    prisma.financialEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        aiDecisionLogs: { take: 1, orderBy: { createdAt: "desc" } },
        externalRefs: true,
      },
    }),
    prisma.financialEvent.count({ where }),
  ])

  const pages = Math.ceil(total / PAGE_SIZE)

  function pageUrl(p: number) {
    const qs = new URLSearchParams()
    if (status) qs.set("status", status)
    if (source) qs.set("source", source)
    if (p > 1) qs.set("page", String(p))
    const s = qs.toString()
    return `/staging${s ? `?${s}` : ""}`
  }

  return (
    <div className="card-default overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              {["Event", "Source", "Amount", "Status", "AI Decision", "When", ""].map((h) => (
                <th key={h} className={`px-4 py-3 text-[11px] uppercase tracking-wider font-medium text-muted-foreground ${h === "Amount" ? "text-right" : "text-left"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <InboxIcon className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No events match these filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const latestDecision = event.aiDecisionLogs[0]
                const externalRef = event.externalRefs[0]
                return (
                  <tr key={event.id} className="table-row-hover">
                    <td className="px-4 py-3.5">
                      <Link href={`/staging/${event.id}`} className="hover:text-primary transition-colors">
                        <p className="font-medium leading-snug">{event.eventType.replace(/_/g, " ")}</p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate max-w-[160px]">
                          {event.externalId}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge-neutral text-[10px] uppercase tracking-wide font-bold">
                        {event.source}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right num">
                      {event.amount != null ? formatCurrency(event.amount, event.currency) : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-4 py-3.5 max-w-[180px]">
                      {latestDecision ? (
                        <div>
                          <p className="text-xs font-medium truncate">{latestDecision.agentName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {latestDecision.decisionType}
                            {latestDecision.confidence != null && ` · ${Math.round(latestDecision.confidence * 100)}%`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelative(event.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        {externalRef?.externalUrl && (
                          <a href={externalRef.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline whitespace-nowrap">
                            View ↗
                          </a>
                        )}
                        {event.status === "APPROVED" && (
                          <PushToQBButton eventId={event.id} />
                        )}
                        {event.status === "FAILED" && (
                          <form action={`/api/events/${event.id}/retry`} method="POST">
                            <button type="submit" className="text-xs text-muted-foreground border rounded-md px-2.5 py-1 hover:bg-muted transition-colors">
                              Retry
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="border-t px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} events
          </p>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <a href={pageUrl(page - 1)} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors">
                Previous
              </a>
            )}
            {page < pages && (
              <a href={pageUrl(page + 1)} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function StagingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const params = await searchParams
  const status = params.status
  const source = params.source
  const page = Number(params.page ?? 1)
  const organizationId = session.user.organizationId

  const sources = await prisma.financialEvent
    .findMany({ where: { organizationId }, select: { source: true }, distinct: ["source"] })
    .then((rows) => rows.map((r) => r.source))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staging Queue"
        description="Every financial event ingested from connected platforms, before being posted to your accounting system."
      />

      <Suspense fallback={null}>
        <StagingFilterBar sources={sources} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <EventsTable
          organizationId={organizationId}
          status={status}
          source={source}
          page={page}
        />
      </Suspense>
    </div>
  )
}
