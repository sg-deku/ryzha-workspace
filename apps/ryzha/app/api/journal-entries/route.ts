import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { syncGLForOrganization, deleteGLEntriesForJournalEntry } from "@/lib/reports/general-ledger/sync"
import { after } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const entries = await prisma.journalEntry.findMany({
    where: { organizationId: session.user.organizationId },
    include: { lines: true },
    orderBy: { entryDate: "desc" },
  })

  return NextResponse.json(entries)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { entryDate, reference, description, lines, type, period, status: reqStatus } = body

    if (!entryDate || !description || !lines || lines.length < 2) {
      return NextResponse.json(
        { error: "Entry requires a date, description, and at least 2 lines" },
        { status: 400 }
      )
    }

    const entryType = type || "REGULAR"
    const entryStatus = reqStatus === "DRAFT" ? "DRAFT" : "POSTED"

    const totalDebit = lines.reduce((s: number, l: any) => s + (Number(l.debit) || 0), 0)
    const totalCredit = lines.reduce((s: number, l: any) => s + (Number(l.credit) || 0), 0)

    if (entryStatus === "POSTED" && Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: `Entry is not balanced. Debits (${totalDebit.toFixed(2)}) must equal credits (${totalCredit.toFixed(2)})` },
        { status: 400 }
      )
    }

    const entry = await prisma.journalEntry.create({
      data: {
        entryDate: new Date(entryDate),
        reference: reference || null,
        description,
        status: entryStatus,
        type: entryType,
        period: period || null,
        organizationId: session.user.organizationId,
        lines: {
          create: lines.map((l: any) => ({
            accountType: l.accountType,
            accountName: l.accountName,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
            description: l.description || null,
          })),
        },
      },
      include: { lines: true },
    })

    if (entryStatus === "POSTED") {
      const orgId = session.user.organizationId
      after(syncGLForOrganization(orgId).catch(console.error))
    }

    return NextResponse.json(entry)
  } catch (err: any) {
    console.error("[journal-entries POST]", err)
    return NextResponse.json({ error: err.message || "Failed to create entry" }, { status: 500 })
  }
}
