import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { after } from "next/server"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { getNextEntityNumber } from "@/lib/sequences"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const vendorId = searchParams.get("vendorId")
  const vendorInvoiceId = searchParams.get("vendorInvoiceId")
  const status = searchParams.get("status")

  const memos = await prisma.vendorDebitMemo.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(vendorId ? { vendorId } : {}),
      ...(vendorInvoiceId ? { vendorInvoiceId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      vendor: { select: { id: true, name: true } },
      vendorInvoice: { select: { id: true, invoiceNumber: true } },
    },
    orderBy: { issueDate: "desc" },
  })

  return NextResponse.json(memos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { vendorId, vendorInvoiceId, amount, reason, reasonCategory, debitType, issueDate, referenceNumber, notes } = body

  if (!vendorId) return NextResponse.json({ error: "vendorId is required" }, { status: 400 })
  if (!amount || amount <= 0) return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
  if (!reason) return NextResponse.json({ error: "Reason is required" }, { status: 400 })

  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, organizationId: session.user.organizationId },
  })
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 })

  const resolvedDebitType: string = debitType || "vendor_credit"
  const memoDate = issueDate ? new Date(issueDate) : new Date()
  const memoAmount = parseFloat(amount)

  const memoNumber = await getNextEntityNumber(session.user.organizationId, "DM")

  const memo = await prisma.vendorDebitMemo.create({
    data: {
      memoNumber,
      vendorId,
      vendorInvoiceId: vendorInvoiceId || null,
      amount: memoAmount,
      reason,
      reasonCategory: reasonCategory || "other",
      debitType: resolvedDebitType,
      issueDate: memoDate,
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      createdById: session.user.id,
      organizationId: session.user.organizationId,
    },
    include: { vendor: true, vendorInvoice: true },
  })

  const jeLines = buildDebitMemoJELines(resolvedDebitType, memoAmount, vendor.name, memoNumber)

  after(
    createSystemJournalEntry({
      organizationId: session.user.organizationId,
      sourceType: "VendorDebitMemo",
      sourceId: memo.id,
      reference: memoNumber,
      description: `Vendor debit memo – ${vendor.name} [${resolvedDebitType}]`,
      entryDate: memoDate,
      lines: jeLines,
    }).catch(console.error)
  )

  return NextResponse.json(memo, { status: 201 })
}

function buildDebitMemoJELines(debitType: string, amount: number, vendorName: string, memoNumber: string) {
  if (debitType === "cash_refund") {
    return [
      {
        accountName: "Cash",
        accountType: "Assets",
        debit: amount,
        credit: 0,
        description: `Cash refund received from ${vendorName} – ${memoNumber}`,
      },
      {
        accountName: "Operating Expenses",
        accountType: "Expenses",
        debit: 0,
        credit: amount,
        description: `Expense reversed – vendor refund from ${vendorName}`,
      },
    ]
  }

  return [
    {
      accountName: "Accounts Payable",
      accountType: "Liabilities",
      debit: amount,
      credit: 0,
      description: `AP reduced – ${vendorName} vendor credit ${memoNumber}`,
    },
    {
      accountName: "Operating Expenses",
      accountType: "Expenses",
      debit: 0,
      credit: amount,
      description: `Expense reversed – vendor credit from ${vendorName}`,
    },
  ]
}
