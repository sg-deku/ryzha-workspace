import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { runCloseAgent } from "@/lib/agents/close-agent"
import { runBoardReportAgent } from "@/lib/agents/board-report-agent"
import { runComplianceAgent } from "@/lib/agents/compliance-agent"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgs = await prisma.organization.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  })

  const results: Record<string, unknown> = {}

  for (const org of orgs) {
    const orgId = org.id
    try {
      const agentConfig = await getAgentConfig(orgId)

      const [close, boardReport, compliance] = await Promise.allSettled([
        agentConfig.closeEnabled ? runCloseAgent(orgId) : Promise.resolve({ skipped: true }),
        agentConfig.boardReportEnabled ? runBoardReportAgent(orgId) : Promise.resolve({ skipped: true }),
        agentConfig.complianceEnabled ? runComplianceAgent(orgId) : Promise.resolve({ skipped: true }),
      ])

      results[orgId] = {
        close: close.status === "fulfilled" ? close.value : { error: (close as any).reason?.message },
        boardReport: boardReport.status === "fulfilled" ? boardReport.value : { error: (boardReport as any).reason?.message },
        compliance: compliance.status === "fulfilled" ? compliance.value : { error: (compliance as any).reason?.message },
      }

      const closedOk = close.status === "fulfilled"
      if (closedOk) {
        await (prisma.notification as any).create({
          data: {
            organizationId: orgId,
            type: "SUCCESS",
            title: "Month-End Close Complete",
            message: "The automated close agent has completed this month's close. Review the close checklist for any exceptions.",
            link: "/close",
          },
        }).catch(() => {})
      }
    } catch (err: any) {
      results[orgId] = { error: err.message }
    }
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results })
}

async function getAgentConfig(organizationId: string) {
  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { agentConfig: true },
  })
  const config = (settings?.agentConfig as Record<string, boolean> | null) ?? {}
  return {
    closeEnabled: config.closeEnabled !== false,
    boardReportEnabled: config.boardReportEnabled !== false,
    complianceEnabled: config.complianceEnabled !== false,
  }
}
