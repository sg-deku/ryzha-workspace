import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { getValidQBToken } from "@/lib/qb-token"
import { pushJournalEntry } from "@ryzha/integrations"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const { id: approvalId } = await params

  const approval = await prisma.financialEventApproval.findFirst({
    where: { id: approvalId, organizationId, status: "PENDING" },
    include: { financialEvent: true },
  })

  if (!approval) {
    return NextResponse.json({ error: "Approval not found or already resolved" }, { status: 404 })
  }

  const event = approval.financialEvent
  const body = await req.json().catch(() => ({}))
  const note: string | undefined = body.note

  await prisma.financialEventApproval.update({
    where: { id: approvalId },
    data: {
      status: "APPROVED",
      decidedAt: new Date(),
      decisionNote: note ?? null,
    },
  })

  let finalStatus: "APPROVED" | "POSTED" = "APPROVED"

  if (event.amount && event.amount > 0) {
    try {
      const qb = await getValidQBToken(organizationId)
      if (qb) {
        const coaMappings = await prisma.cOAMapping.findMany({
          where: { organizationId, integrationConnectionId: qb.connectionId, isActive: true },
          select: { externalCode: true, externalName: true, accountType: true, ryzhaCategoryHint: true },
        })

        const expenseAccount =
          coaMappings.find((m) =>
            m.accountType === "Expense" ||
            m.ryzhaCategoryHint?.toLowerCase().includes("expense")
          )?.externalCode ?? "6000"

        const liabilityAccount =
          coaMappings.find((m) =>
            m.externalName.toLowerCase().includes("accounts payable") ||
            m.externalName.toLowerCase().includes("payable")
          )?.externalCode ?? "2000"

        const description =
          (event.normalisedData as any)?.merchantName ??
          (event.normalisedData as any)?.vendorName ??
          event.eventType.replace(/_/g, " ")

        await pushJournalEntry(
          { provider: "QUICKBOOKS", accessToken: qb.accessToken, realmId: qb.realmId },
          {
            organizationId,
            date: event.createdAt,
            description: `Approved: ${description}`,
            reference: `APV-${approvalId.slice(-8).toUpperCase()}`,
            lines: [
              { externalAccountCode: expenseAccount, debit: event.amount, credit: 0, description },
              { externalAccountCode: liabilityAccount, debit: 0, credit: event.amount, description: "Accounts payable" },
            ],
          }
        )

        await prisma.financialEvent.update({
          where: { id: event.id },
          data: { status: "POSTED", pushedAt: new Date() },
        })
        finalStatus = "POSTED"
      } else {
        await prisma.financialEvent.update({
          where: { id: event.id },
          data: { status: "APPROVED" },
        })
      }
    } catch {
      await prisma.financialEvent.update({
        where: { id: event.id },
        data: { status: "APPROVED" },
      })
    }
  } else {
    await prisma.financialEvent.update({
      where: { id: event.id },
      data: { status: "APPROVED" },
    })
  }

  return NextResponse.json({ ok: true, finalStatus })
}
