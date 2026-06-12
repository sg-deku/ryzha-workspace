import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { getValidQBToken } from "@/lib/qb-token"
import { pushJournalEntry } from "@ryzha/integrations"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const body = await req.json().catch(() => ({}))
  const { eventIds } = body as { eventIds?: string[] }

  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    return NextResponse.json({ error: "Provide eventIds array" }, { status: 400 })
  }

  const qb = await getValidQBToken(organizationId)
  if (!qb) {
    return NextResponse.json({ error: "QuickBooks not connected or token expired" }, { status: 400 })
  }

  const coaMappings = await prisma.cOAMapping.findMany({
    where: { organizationId, integrationConnectionId: qb.connectionId, isActive: true },
    select: { externalCode: true, externalName: true, accountType: true, ryzhaCategoryHint: true },
  })

  const expenseAccount =
    coaMappings.find((m) =>
      m.accountType === "Expense" ||
      m.ryzhaCategoryHint?.toLowerCase().includes("expense")
    )?.externalCode ?? "6000"

  const revenueAccount =
    coaMappings.find((m) =>
      m.accountType === "Income" ||
      m.ryzhaCategoryHint?.toLowerCase().includes("revenue")
    )?.externalCode ?? "4000"

  const arAccount =
    coaMappings.find((m) =>
      m.externalName.toLowerCase().includes("accounts receivable")
    )?.externalCode ?? "1200"

  const apAccount =
    coaMappings.find((m) =>
      m.externalName.toLowerCase().includes("accounts payable")
    )?.externalCode ?? "2000"

  const events = await prisma.financialEvent.findMany({
    where: { id: { in: eventIds }, organizationId, status: "APPROVED" },
  })

  if (events.length === 0) {
    return NextResponse.json({ error: "No APPROVED events found for the given IDs" }, { status: 404 })
  }

  const results: { id: string; ok: boolean; qbId?: string; error?: string }[] = []

  for (const event of events) {
    if (!event.amount || event.amount <= 0) {
      results.push({ id: event.id, ok: false, error: "Zero or negative amount, skipped" })
      continue
    }

    const isRevenue = ["PAYMENT_RECEIVED", "INVOICE_PAID", "SUBSCRIPTION_CREATED"].includes(event.eventType)
    const description =
      (event.normalisedData as any)?.merchantName ??
      (event.normalisedData as any)?.vendorName ??
      (event.normalisedData as any)?.description ??
      event.eventType.replace(/_/g, " ")

    const debitAccount  = isRevenue ? arAccount : expenseAccount
    const creditAccount = isRevenue ? revenueAccount : apAccount

    try {
      const result = await pushJournalEntry(
        { provider: "QUICKBOOKS", accessToken: qb.accessToken, realmId: qb.realmId },
        {
          organizationId,
          date: event.createdAt,
          description: `Ryzha: ${description}`,
          reference: `RJE-${event.id.slice(-8).toUpperCase()}`,
          lines: [
            { externalAccountCode: debitAccount,  debit: event.amount, credit: 0,            description },
            { externalAccountCode: creditAccount, debit: 0,            credit: event.amount, description },
          ],
        }
      )

      await prisma.financialEvent.update({
        where: { id: event.id },
        data: { status: "POSTED", pushedAt: new Date() },
      })

      await prisma.integrationSyncLog.create({
        data: {
          integrationConnectionId: qb.connectionId,
          direction: "PUSH",
          entityType: event.eventType,
          status: "SUCCESS",
          responsePayload: result as any,
        },
      })

      results.push({ id: event.id, ok: true, qbId: result.externalId })
    } catch (err: any) {
      await prisma.integrationSyncLog.create({
        data: {
          integrationConnectionId: qb.connectionId,
          direction: "PUSH",
          entityType: event.eventType,
          status: "FAILED",
          errorMessage: err.message,
        },
      })
      results.push({ id: event.id, ok: false, error: err.message })
    }
  }

  const pushed = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length

  return NextResponse.json({ ok: true, pushed, failed, results })
}
