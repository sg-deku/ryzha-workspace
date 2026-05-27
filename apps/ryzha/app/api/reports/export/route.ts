import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return ""
    const s = String(v)
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const lines = [headers.join(","), ...rows.map((row) => row.map(escape).join(","))]
  return lines.join("\n")
}

function ageBucket(dueDate: Date): string {
  const days = Math.floor((Date.now() - dueDate.getTime()) / 86400000)
  if (days <= 0) return "Current"
  if (days <= 30) return "1-30 days"
  if (days <= 60) return "31-60 days"
  if (days <= 90) return "61-90 days"
  return "90+ days"
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const organizationId = session.user.organizationId
  const type = req.nextUrl.searchParams.get("type")

  let csv = ""
  let filename = "export.csv"

  if (type === "ar-aging") {
    filename = `ar-aging-${new Date().toISOString().slice(0, 10)}.csv`
    const invoices = await prisma.invoice.findMany({
      where: { organizationId, status: { notIn: ["PAID", "VOID", "REFUNDED"] } },
      orderBy: { dueDate: "asc" },
    })
    csv = toCSV(
      ["Invoice #", "Client", "Issue Date", "Due Date", "Status", "Age Bucket", "Amount"],
      invoices.map((inv) => [
        inv.invoiceNumber,
        inv.clientName,
        inv.issueDate.toISOString().slice(0, 10),
        inv.dueDate.toISOString().slice(0, 10),
        inv.status,
        ageBucket(inv.dueDate),
        inv.total,
      ])
    )
  } else if (type === "ap-aging") {
    filename = `ap-aging-${new Date().toISOString().slice(0, 10)}.csv`
    const invoices = await prisma.vendorInvoice.findMany({
      where: { organizationId, status: { notIn: ["PAID", "CANCELLED"] } },
      include: { vendor: true },
      orderBy: { dueDate: "asc" },
    })
    csv = toCSV(
      ["Invoice #", "Vendor", "Due Date", "Status", "Age Bucket", "Amount"],
      invoices.map((inv) => [
        inv.invoiceNumber,
        inv.vendor.name,
        inv.dueDate.toISOString().slice(0, 10),
        inv.status,
        ageBucket(inv.dueDate),
        inv.amount,
      ])
    )
  } else if (type === "general-ledger") {
    filename = `general-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    const entries = await prisma.generalLedgerEntry.findMany({
      where: { organizationId },
      orderBy: { date: "desc" },
    })
    csv = toCSV(
      ["Date", "Account Type", "Account Name", "Debit", "Credit", "Amount", "Description", "Source Type", "Source ID"],
      entries.map((e) => [
        e.date.toISOString().slice(0, 10),
        e.accountType,
        e.accountName,
        e.debit,
        e.credit,
        e.amount,
        e.description,
        e.sourceType,
        e.sourceId,
      ])
    )
  } else if (type === "balance-sheet") {
    filename = `balance-sheet-${new Date().toISOString().slice(0, 10)}.csv`
    const entries = await prisma.generalLedgerEntry.findMany({ where: { organizationId } })
    const buckets: Record<string, { debit: number; credit: number }> = {}
    for (const e of entries) {
      const key = `${e.accountType}::${e.accountName}`
      if (!buckets[key]) buckets[key] = { debit: 0, credit: 0 }
      buckets[key].debit += e.debit
      buckets[key].credit += e.credit
    }
    const rows = Object.entries(buckets).map(([key, { debit, credit }]) => {
      const [type, name] = key.split("::")
      const balance = (type === "Assets") ? debit - credit : credit - debit
      return [type, name, balance]
    })
    csv = toCSV(["Account Type", "Account Name", "Balance"], rows)
  } else {
    return NextResponse.json({ error: "Unknown report type. Use: ar-aging, ap-aging, general-ledger, balance-sheet" }, { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
