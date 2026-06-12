import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { group } = body

  if (!["sync", "daily", "monthly"].includes(group)) {
    return NextResponse.json({ error: "Invalid group. Must be sync, daily, or monthly" }, { status: 400 })
  }

  const organizationId = session.user.organizationId

  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { agentConfig: true },
  })
  const config = (settings?.agentConfig as Record<string, boolean> | null) ?? {}

  try {
    let result: Record<string, unknown> = {}

    if (group === "sync") {
      const revenueModule = await import("@/lib/agents/revenue-agent")
      const cashModule = await import("@/lib/agents/cash-agent")
      const apModule = await import("@/lib/agents/ap-agent")
      const anomalyModule = await import("@/lib/agents/anomaly-agent")
      const glModule = await import("@/lib/agents/gl-coding-agent")

      const [glCoding, revenue, cash, ap, anomaly] = await Promise.allSettled([
        config.glCodingEnabled !== false ? glModule.runGLCodingAgent(organizationId) : Promise.resolve({ skipped: true }),
        config.revenueEnabled !== false ? revenueModule.runRevenueAgent(organizationId) : Promise.resolve({ skipped: true }),
        config.cashEnabled !== false ? cashModule.runCashAgent(organizationId) : Promise.resolve({ skipped: true }),
        config.apEnabled !== false ? apModule.runAPAgent(organizationId) : Promise.resolve({ skipped: true }),
        config.anomalyEnabled !== false ? anomalyModule.runAnomalyAgent(organizationId) : Promise.resolve({ skipped: true }),
      ])

      result = {
        glCoding:  glCoding.status === "fulfilled" ? glCoding.value : { error: (glCoding as PromiseRejectedResult).reason?.message },
        revenue:   revenue.status === "fulfilled" ? revenue.value : { error: (revenue as PromiseRejectedResult).reason?.message },
        cash:      cash.status === "fulfilled" ? cash.value : { error: (cash as PromiseRejectedResult).reason?.message },
        ap:        ap.status === "fulfilled" ? ap.value : { error: (ap as PromiseRejectedResult).reason?.message },
        anomaly:   anomaly.status === "fulfilled" ? anomaly.value : { error: (anomaly as PromiseRejectedResult).reason?.message },
      }
    }

    if (group === "daily") {
      const payrollModule = await import("@/lib/agents/payroll-agent")
      const fxModule = await import("@/lib/agents/fx-agent")
      const headcountModule = await import("@/lib/agents/headcount-agent")
      const collectionsModule = await import("@/lib/agents/collections-agent")

      const [payroll, fx, headcount, collections] = await Promise.allSettled([
        config.payrollEnabled !== false ? payrollModule.runPayrollAgent(organizationId) : Promise.resolve({ skipped: true }),
        config.fxEnabled !== false ? fxModule.runFXAgent(organizationId) : Promise.resolve({ skipped: true }),
        config.headcountEnabled !== false ? headcountModule.runHeadcountAgent(organizationId) : Promise.resolve({ skipped: true }),
        config.collectionsEnabled !== false ? collectionsModule.runCollectionsAgent(organizationId) : Promise.resolve({ skipped: true }),
      ])

      result = {
        payroll:     payroll.status === "fulfilled" ? payroll.value : { error: (payroll as PromiseRejectedResult).reason?.message },
        fx:          fx.status === "fulfilled" ? fx.value : { error: (fx as PromiseRejectedResult).reason?.message },
        headcount:   headcount.status === "fulfilled" ? headcount.value : { error: (headcount as PromiseRejectedResult).reason?.message },
        collections: collections.status === "fulfilled" ? collections.value : { error: (collections as PromiseRejectedResult).reason?.message },
      }
    }

    if (group === "monthly") {
      const closeModule = await import("@/lib/agents/close-agent")
      const boardModule = await import("@/lib/agents/board-report-agent")
      const complianceModule = await import("@/lib/agents/compliance-agent")

      const [close, boardReport, compliance] = await Promise.allSettled([
        config.closeEnabled !== false ? closeModule.runCloseAgent(organizationId) : Promise.resolve({ skipped: true }),
        config.boardReportEnabled !== false ? boardModule.runBoardReportAgent(organizationId) : Promise.resolve({ skipped: true }),
        config.complianceEnabled !== false ? complianceModule.runComplianceAgent(organizationId) : Promise.resolve({ skipped: true }),
      ])

      result = {
        close:       close.status === "fulfilled" ? close.value : { error: (close as PromiseRejectedResult).reason?.message },
        boardReport: boardReport.status === "fulfilled" ? boardReport.value : { error: (boardReport as PromiseRejectedResult).reason?.message },
        compliance:  compliance.status === "fulfilled" ? compliance.value : { error: (compliance as PromiseRejectedResult).reason?.message },
      }
    }

    return NextResponse.json({ ok: true, group, ranAt: new Date().toISOString(), result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
