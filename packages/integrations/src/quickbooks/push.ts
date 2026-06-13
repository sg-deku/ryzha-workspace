import { createQBClient } from "./client"
import type { PushJournalEntryInput, PushResult } from "../types"

export async function pushQBBill(
  accessToken: string,
  realmId: string,
  bill: {
    vendorId: string
    txnDate: string
    dueDate?: string
    lines: { accountId: string; amount: number; description?: string }[]
  }
): Promise<PushResult> {
  const client = createQBClient(accessToken, realmId)

  const payload = {
    VendorRef: { value: bill.vendorId },
    TxnDate: bill.txnDate,
    DueDate: bill.dueDate,
    Line: bill.lines.map((l, i) => ({
      Id: String(i + 1),
      DetailType: "AccountBasedExpenseLineDetail",
      Amount: l.amount,
      Description: l.description,
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: l.accountId },
      },
    })),
  }

  const { data } = await client.post("/bill", payload, {
    params: { minorversion: 70 },
  })

  return {
    externalId: data.Bill.Id,
    provider: "QUICKBOOKS",
    externalUrl: `https://app.qbo.intuit.com/app/bill?txnId=${data.Bill.Id}`,
  }
}

export async function pushQBExpense(
  accessToken: string,
  realmId: string,
  expense: {
    paymentAccountId: string
    txnDate: string
    lines: { accountId: string; amount: number; description?: string }[]
  }
): Promise<PushResult> {
  const client = createQBClient(accessToken, realmId)

  const payload = {
    PaymentType: "Cash",
    AccountRef: { value: expense.paymentAccountId },
    TxnDate: expense.txnDate,
    Line: expense.lines.map((l, i) => ({
      Id: String(i + 1),
      DetailType: "AccountBasedExpenseLineDetail",
      Amount: l.amount,
      Description: l.description,
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: l.accountId },
      },
    })),
  }

  const { data } = await client.post("/purchase", payload, {
    params: { minorversion: 70 },
  })

  return {
    externalId: data.Purchase.Id,
    provider: "QUICKBOOKS",
  }
}

export async function pushQBJournalEntry(
  accessToken: string,
  realmId: string,
  entry: PushJournalEntryInput
): Promise<PushResult> {
  const client = createQBClient(accessToken, realmId)

  const isSandbox = isSandboxToken(accessToken)
  const webBase = isSandbox
    ? "https://sandbox.qbo.intuit.com"
    : "https://app.qbo.intuit.com"

  const payload = {
    TxnDate: entry.date.toISOString().split("T")[0],
    PrivateNote: entry.reference,
    DocNumber: entry.reference,
    Line: entry.lines.map((l, i) => ({
      Id: String(i + 1),
      DetailType: "JournalEntryLineDetail",
      Amount: l.debit > 0 ? l.debit : l.credit,
      Description: l.description,
      JournalEntryLineDetail: {
        PostingType: l.debit > 0 ? "Debit" : "Credit",
        AccountRef: { value: l.externalAccountCode },
      },
    })),
  }

  const { data } = await client.post("/journalentry", payload, {
    params: { minorversion: 70 },
  })

  const id = data.JournalEntry.Id

  return {
    externalId: id,
    provider: "QUICKBOOKS",
    externalUrl: `${webBase}/app/journal?companyId=${realmId}&txnId=${id}`,
  }
}
