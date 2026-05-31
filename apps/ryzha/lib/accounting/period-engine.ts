import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, addMonths, format } from "date-fns"

export type PeriodStatus = "OPEN" | "SOFT_CLOSE" | "HARD_CLOSE"

export async function getPeriodForDate(organizationId: string, date: Date) {
  return prisma.accountingPeriod.findFirst({
    where: {
      organizationId,
      startDate: { lte: date },
      endDate: { gte: date },
    },
  })
}

export async function validatePostingDate(
  organizationId: string,
  date: Date,
  opts: { overrideSoftClose?: boolean } = {}
): Promise<{ allowed: boolean; status: PeriodStatus | null; periodName: string | null; error?: string }> {
  const period = await getPeriodForDate(organizationId, date)
  if (!period) return { allowed: true, status: null, periodName: null }

  if (period.status === "HARD_CLOSE") {
    return {
      allowed: false,
      status: "HARD_CLOSE",
      periodName: period.name,
      error: `Period "${period.name}" is hard-closed. Post an adjusting entry in the current open period instead.`,
    }
  }

  if (period.status === "SOFT_CLOSE" && !opts.overrideSoftClose) {
    return {
      allowed: false,
      status: "SOFT_CLOSE",
      periodName: period.name,
      error: `Period "${period.name}" is soft-closed. Only administrators can post to this period.`,
    }
  }

  return { allowed: true, status: period.status as PeriodStatus, periodName: period.name }
}

export async function generateFiscalPeriods(organizationId: string, fiscalYear: number) {
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const periods = []
  for (let m = 0; m < 12; m++) {
    const start = startOfMonth(new Date(fiscalYear, m, 1))
    const end = endOfMonth(start)
    const name = `${MONTH_NAMES[m]} ${fiscalYear}`

    const existing = await prisma.accountingPeriod.findFirst({
      where: { organizationId, startDate: start },
      select: { id: true },
    })
    if (existing) { periods.push(existing); continue }

    const period = await prisma.accountingPeriod.create({
      data: {
        id: crypto.randomUUID(),
        organizationId,
        name,
        startDate: start,
        endDate: end,
        fiscalYear,
        status: "OPEN",
      },
    })
    periods.push(period)
  }
  return periods
}

export async function runPreCloseChecklist(organizationId: string, periodId: string) {
  const period = await prisma.accountingPeriod.findUnique({ where: { id: periodId } })
  if (!period) throw new Error("Period not found")

  const [
    unmatchedBank,
    openARInvoices,
    openAPInvoices,
    draftJEs,
    unpostedDeferred,
  ] = await Promise.all([
    prisma.bankTransaction.count({
      where: {
        organizationId,
        matchStatus: "unmatched",
        date: { gte: period.startDate, lte: period.endDate },
      },
    }),
    prisma.invoice.count({
      where: {
        organizationId,
        status: { in: ["SENT", "PARTIAL"] },
        dueDate: { lte: period.endDate },
      },
    }),
    prisma.vendorInvoice.count({
      where: {
        organizationId,
        status: { in: ["PENDING", "PARTIAL"] },
        dueDate: { lte: period.endDate },
      },
    }),
    prisma.journalEntry.count({
      where: {
        organizationId,
        status: "DRAFT",
        entryDate: { gte: period.startDate, lte: period.endDate },
      },
    }),
    prisma.depreciationSchedule.count({
      where: {
        organizationId,
        period: { gte: period.startDate, lte: period.endDate },
        posted: false,
      },
    }),
  ])

  return [
    { key: "unmatched_bank", label: "Unmatched bank transactions in period", count: unmatchedBank, pass: unmatchedBank === 0 },
    { key: "open_ar", label: "Open AR invoices past due", count: openARInvoices, pass: openARInvoices === 0 },
    { key: "open_ap", label: "Open AP invoices past due", count: openAPInvoices, pass: openAPInvoices === 0 },
    { key: "draft_jes", label: "Draft journal entries in period", count: draftJEs, pass: draftJEs === 0 },
    { key: "unposted_depreciation", label: "Unposted depreciation entries", count: unpostedDeferred, pass: unpostedDeferred === 0 },
  ]
}

export async function softClosePeriod(organizationId: string, periodId: string, userId: string) {
  const period = await prisma.accountingPeriod.findUnique({ where: { id: periodId } })
  if (!period || period.organizationId !== organizationId) throw new Error("Period not found")
  if (period.status === "HARD_CLOSE") throw new Error("Cannot soft-close a hard-closed period")

  return prisma.accountingPeriod.update({
    where: { id: periodId },
    data: { status: "SOFT_CLOSE", closedBy: userId, closedAt: new Date() },
  })
}

export async function hardClosePeriod(organizationId: string, periodId: string, userId: string) {
  const period = await prisma.accountingPeriod.findUnique({ where: { id: periodId } })
  if (!period || period.organizationId !== organizationId) throw new Error("Period not found")

  const checklist = await runPreCloseChecklist(organizationId, periodId)
  const blockers = checklist.filter(c => !c.pass && ["draft_jes", "unposted_depreciation"].includes(c.key))
  if (blockers.length > 0) {
    throw new Error(`Cannot hard-close: ${blockers.map(b => b.label).join("; ")}`)
  }

  return prisma.accountingPeriod.update({
    where: { id: periodId },
    data: { status: "HARD_CLOSE", closedBy: userId, closedAt: new Date() },
  })
}

export async function reopenPeriod(organizationId: string, periodId: string, _userId: string) {
  const period = await prisma.accountingPeriod.findUnique({ where: { id: periodId } })
  if (!period || period.organizationId !== organizationId) throw new Error("Period not found")

  return prisma.accountingPeriod.update({
    where: { id: periodId },
    data: { status: "OPEN", closedBy: null, closedAt: null },
  })
}
