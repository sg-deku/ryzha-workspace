import { prisma } from "@/lib/prisma"
import { pullGustoPayrolls } from "@ryzha/integrations"
import { pushJournalEntry } from "@ryzha/integrations"

export interface PayrollAgentResult {
  processed: number
  posted: number
  failed: number
  totalGrossPay: number
}

export async function runPayrollAgent(organizationId: string): Promise<PayrollAgentResult> {
  const result: PayrollAgentResult = { processed: 0, posted: 0, failed: 0, totalGrossPay: 0 }

  const gustoConn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "GUSTO" } },
    select: { id: true, accessToken: true, scope: true, status: true },
  })
  if (!gustoConn || gustoConn.status !== "ACTIVE" || !gustoConn.scope) return result

  let companyId: string
  try {
    companyId = JSON.parse(gustoConn.scope).companyId
    if (!companyId) return result
  } catch { return result }

  const qbConn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
    select: { id: true, accessToken: true, realmId: true, status: true },
  })

  const payrolls = await pullGustoPayrolls(gustoConn.accessToken, companyId, { daysSince: 45 })

  for (const payroll of payrolls) {
    result.processed++
    const gross = (payroll.normalisedData as any).grossPay ?? 0
    result.totalGrossPay += gross

    try {
      const created = await prisma.financialEvent.upsert({
        where: { organizationId_source_externalId: { organizationId, source: payroll.source, externalId: payroll.externalId } },
        create: {
          organizationId,
          source: payroll.source,
          externalId: payroll.externalId,
          eventType: payroll.eventType as any,
          status: "INGESTED",
          amount: payroll.amount ?? null,
          currency: "USD",
          rawPayload: payroll.rawPayload as any,
          normalisedData: payroll.normalisedData as any,
        },
        update: {},
      })

      if (qbConn?.status === "ACTIVE" && qbConn.realmId && gross > 0) {
        const coaMappings = await prisma.cOAMapping.findMany({
          where: { organizationId, integrationConnectionId: qbConn.id, isActive: true },
          select: { externalCode: true, externalName: true, accountType: true, ryzhaCategoryHint: true },
        })

        const payrollExpenseAccount = coaMappings.find((m) =>
          m.externalName.toLowerCase().includes("payroll") || m.ryzhaCategoryHint?.toLowerCase().includes("payroll")
        )?.externalCode ?? "5000"

        const payrollLiabilityAccount = coaMappings.find((m) =>
          m.externalName.toLowerCase().includes("payroll liab") || m.accountType === "Other Current Liability"
        )?.externalCode ?? "2000"

        const nd = payroll.normalisedData as any
        await pushJournalEntry(
          { provider: "QUICKBOOKS", accessToken: qbConn.accessToken, realmId: qbConn.realmId },
          {
            organizationId,
            date: nd.checkDate ? new Date(nd.checkDate) : new Date(),
            description: `Payroll - ${nd.payPeriodStart} to ${nd.payPeriodEnd}`,
            reference: `PAY-${payroll.externalId.slice(-8).toUpperCase()}`,
            lines: [
              { externalAccountCode: payrollExpenseAccount, debit: gross, credit: 0, description: `Gross payroll - ${nd.employeeCount} employees` },
              { externalAccountCode: payrollLiabilityAccount, debit: 0, credit: gross, description: "Payroll payable" },
            ],
          }
        )

        await prisma.financialEvent.update({ where: { id: created.id }, data: { status: "POSTED", pushedAt: new Date() } })
        result.posted++
      } else {
        await prisma.financialEvent.update({ where: { id: created.id }, data: { status: "APPROVED" } })
        result.posted++
      }
    } catch (err: any) {
      result.failed++
      console.error("[payroll-agent]", err.message)
    }
  }

  return result
}
