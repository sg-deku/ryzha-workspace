import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { syncGLForOrganization, deleteGLEntriesForJournalEntry } from "@/lib/reports/general-ledger/sync"
import { after } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const entry = await prisma.journalEntry.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { lines: true },
  })

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(entry)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { action } = body

  const entry = await prisma.journalEntry.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { lines: true },
  })
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (action === "post") {
    if (entry.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT entries can be posted" }, { status: 400 })
    }
    const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ error: "Entry is not balanced" }, { status: 400 })
    }
    const posted = await prisma.journalEntry.update({
      where: { id },
      data: { status: "POSTED" },
      include: { lines: true },
    })
    const orgId = session.user.organizationId
    after(syncGLForOrganization(orgId).catch(console.error))
    return NextResponse.json(posted)
  }

  if (action === "reverse") {
    if (entry.status !== "POSTED") {
      return NextResponse.json({ error: "Only POSTED entries can be reversed" }, { status: 400 })
    }
    if (entry.reversedById) {
      return NextResponse.json({ error: "Entry has already been reversed" }, { status: 400 })
    }

    const reversalDate = body.reversalDate ? new Date(body.reversalDate) : new Date()

    const reversal = await prisma.journalEntry.create({
      data: {
        entryDate: reversalDate,
        reference: `REV-${entry.reference || entry.id.slice(-6)}`,
        description: `Reversal of: ${entry.description}`,
        status: "POSTED",
        type: "REVERSING",
        period: body.period || null,
        reversalOf: entry.id,
        organizationId: session.user.organizationId,
        lines: {
          create: entry.lines.map((l) => ({
            accountType: l.accountType,
            accountName: l.accountName,
            debit: l.credit,
            credit: l.debit,
            description: l.description,
          })),
        },
      },
      include: { lines: true },
    })

    await prisma.journalEntry.update({
      where: { id },
      data: { reversedById: reversal.id, status: "REVERSED" },
    })

    await deleteGLEntriesForJournalEntry(id, session.user.organizationId)
    const orgId = session.user.organizationId
    after(syncGLForOrganization(orgId).catch(console.error))

    return NextResponse.json(reversal)
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const entry = await prisma.journalEntry.findFirst({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (entry.status === "POSTED") {
    return NextResponse.json({ error: "Cannot delete a posted entry. Use reverse instead." }, { status: 400 })
  }

  await prisma.journalEntryLine.deleteMany({ where: { journalEntryId: id } })
  await prisma.journalEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
