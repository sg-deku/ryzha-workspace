import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim().toLowerCase())
  return lines.slice(1).map(line => {
    const vals: string[] = []
    let cur = ""
    let inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue }
      if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue }
      cur += ch
    }
    vals.push(cur.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? "" })
    return row
  })
}

const DATE_KEYS = ["date", "transaction date", "value date", "posting date", "txn date"]
const DESC_KEYS = ["description", "memo", "narration", "details", "transaction description", "payee"]
const AMOUNT_KEYS = ["amount", "debit/credit", "credit", "debit", "transaction amount"]
const REF_KEYS = ["reference", "ref", "check number", "transaction id", "txn id"]
const BALANCE_KEYS = ["balance", "running balance", "closing balance"]
const COUNTERPARTY_KEYS = ["counterparty", "payee name", "beneficiary", "payer"]

function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k]
  }
  return ""
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const closingBalanceStr = formData.get("closingBalance") as string | null

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length === 0) return NextResponse.json({ error: "CSV is empty or malformed" }, { status: 400 })

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    const dateStr = pick(row, DATE_KEYS)
    const description = pick(row, DESC_KEYS)
    const amountStr = pick(row, AMOUNT_KEYS)
    const reference = pick(row, REF_KEYS)
    const balanceStr = pick(row, BALANCE_KEYS)
    const counterparty = pick(row, COUNTERPARTY_KEYS)

    if (!dateStr || !description || !amountStr) { skipped++; continue }

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) { skipped++; continue }

    const amount = parseFloat(amountStr.replace(/[,$]/g, ""))
    if (isNaN(amount)) { skipped++; continue }

    const balance = balanceStr ? parseFloat(balanceStr.replace(/[,$]/g, "")) : null

    const existing = await prisma.bankTransaction.findFirst({
      where: {
        organizationId: orgId,
        date,
        amount,
        description: { contains: description.slice(0, 20) },
      },
    })
    if (existing) { skipped++; continue }

    await prisma.bankTransaction.create({
      data: {
        organizationId: orgId,
        date,
        description,
        amount,
        balance: isNaN(balance!) ? null : balance,
        reference: reference || null,
        counterparty: counterparty || null,
        matchStatus: "unmatched",
        source: "csv_import",
        currency: "USD",
      },
    })
    imported++
  }

  if (closingBalanceStr) {
    const closingBalance = parseFloat(closingBalanceStr)
    if (!isNaN(closingBalance)) {
      await prisma.organization.update({
        where: { id: orgId },
        data: { bankStatementClosingBalance: closingBalance } as any,
      }).catch(() => {})
    }
  }

  return NextResponse.json({ imported, skipped, total: rows.length })
}
