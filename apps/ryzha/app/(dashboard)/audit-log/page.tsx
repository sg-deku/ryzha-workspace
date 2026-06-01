import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageShell } from "@/components/ui/page-shell"
import { DataPagination } from "@/components/ui/data-pagination"
import { Suspense } from "react"
import { AuditLogFilters } from "./audit-log-filters"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  STATUS_CHANGE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  POST: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  REVERSE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  APPROVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  REJECT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  VOID: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  PERIOD_CLOSE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  PERIOD_REOPEN: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  PAYMENT_RECORDED: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  INVITE_USER: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
}

interface Props {
  searchParams: Promise<{
    page?: string
    entityType?: string
    action?: string
    from?: string
    to?: string
  }>
}

export default async function AuditLogPage({ searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect("/auth/signin")

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const entityType = params.entityType || undefined
  const action = params.action || undefined
  const from = params.from || undefined
  const to = params.to || undefined

  const where = {
    organizationId: session.user.organizationId,
    ...(entityType ? { entityType } : {}),
    ...(action ? { action } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ])

  return (
    <PageShell
      title="Audit Log"
      subtitle="Field-level trail of all financial mutations for SOC 2 compliance"
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {total.toLocaleString()} event{total !== 1 ? "s" : ""}
            </CardTitle>
            <Suspense>
              <AuditLogFilters />
            </Suspense>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[120px]">Action</TableHead>
                <TableHead className="w-[160px]">Entity Type</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[110px]">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No audit events found
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => {
                const details = (log.details ?? {}) as Record<string, unknown>
                const changedFields = log.changedFields ?? []
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.entityType}
                      <div className="text-[10px] truncate max-w-[140px]">{log.entityId.slice(-8)}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{log.actorEmail ?? log.actorId}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="max-w-[300px]">
                        {Object.entries(details)
                          .slice(0, 3)
                          .map(([k, v]) => (
                            <span key={k} className="mr-2">
                              <span className="font-medium">{k}:</span>{" "}
                              {typeof v === "object" ? JSON.stringify(v) : String(v ?? "")}
                            </span>
                          ))}
                        {changedFields.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {changedFields.map((f) => (
                              <Badge key={f} variant="outline" className="text-[10px] py-0">
                                {f}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.ipAddress ?? "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="px-6 pb-4">
            <DataPagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
