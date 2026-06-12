import axios from "axios"
import type { NormalisedFinancialEvent } from "../types"

const RAMP_API = "https://api.ramp.com/developer/v1"

export async function pullRampTransactions(
  accessToken: string,
  options: { daysSince?: number } = {}
): Promise<NormalisedFinancialEvent[]> {
  const { daysSince = 90 } = options
  const from = new Date(Date.now() - daysSince * 86400 * 1000).toISOString()

  const client = axios.create({
    baseURL: RAMP_API,
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const { data } = await client.get("/transactions", {
    params: { from_date: from, page_size: 500, state: "CLEARED" },
  })

  const transactions: any[] = data?.data ?? []

  return transactions.map((tx: any) => ({
    source: "ramp",
    externalId: tx.id,
    eventType: "EXPENSE_CREATED",
    amount: Math.abs(tx.amount) / 100,
    currency: tx.currency_code ?? "USD",
    rawPayload: tx,
    normalisedData: {
      merchantName: tx.merchant_name ?? null,
      merchantCategory: tx.merchant_category_code ?? null,
      categoryHint: tx.sk_category_name ?? null,
      cardholderName: tx.cardholder_name ?? null,
      department: tx.department?.name ?? null,
      memoNote: tx.memo ?? null,
      policyViolations: tx.policy_violations ?? [],
      receipts: tx.receipts?.length ?? 0,
    },
  }))
}

export async function pullRampBills(
  accessToken: string,
  options: { daysSince?: number } = {}
): Promise<NormalisedFinancialEvent[]> {
  const { daysSince = 90 } = options
  const from = new Date(Date.now() - daysSince * 86400 * 1000).toISOString()

  const client = axios.create({
    baseURL: RAMP_API,
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const { data } = await client.get("/bills", {
    params: { from_date: from, page_size: 200 },
  })

  const bills: any[] = data?.data ?? []

  return bills.map((bill: any) => ({
    source: "ramp",
    externalId: `bill_${bill.id}`,
    eventType: "BILL_CREATED",
    amount: parseFloat(bill.amount?.amount ?? "0"),
    currency: bill.amount?.currency_code ?? "USD",
    rawPayload: bill,
    normalisedData: {
      vendorName: bill.vendor?.name ?? null,
      dueDate: bill.due_date ?? null,
      invoiceNumber: bill.invoice_number ?? null,
      description: bill.description ?? null,
      paymentStatus: bill.payment_status ?? null,
    },
  }))
}
