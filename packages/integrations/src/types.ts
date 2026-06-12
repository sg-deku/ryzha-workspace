export type IntegrationProvider =
  | "QUICKBOOKS"
  | "XERO"
  | "SAGE_INTACCT"
  | "NETSUITE"
  | "GUSTO"
  | "RIPPLING"
  | "RAMP"
  | "MERCURY"
  | "CHARGEBEE"
  | "STRIPE"
  | "SALESFORCE"
  | "HUBSPOT"

export type FinancialEventType =
  | "PAYMENT_RECEIVED"
  | "INVOICE_PAID"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_UPDATED"
  | "EXPENSE_CREATED"
  | "PAYROLL_PROCESSED"
  | "HEADCOUNT_CHANGE"
  | "BANK_TRANSACTION"
  | "BILL_CREATED"
  | "REFUND_ISSUED"

export interface NormalisedFinancialEvent {
  source: string
  externalId: string
  eventType: FinancialEventType
  amount?: number
  currency?: string
  rawPayload: Record<string, unknown>
  normalisedData: Record<string, unknown>
}

export interface PushJournalEntryInput {
  organizationId: string
  date: Date
  description: string
  reference: string
  lines: {
    externalAccountCode: string
    debit: number
    credit: number
    description?: string
  }[]
}

export interface PushResult {
  externalId: string
  provider: IntegrationProvider
  externalUrl?: string
}

export interface PullARAgingResult {
  customerId: string
  customerName: string
  current: number
  days1to30: number
  days31to60: number
  days61to90: number
  over90: number
  total: number
}

export interface PullBankBalanceResult {
  accountId: string
  accountName: string
  balance: number
  currency: string
  asOf: Date
}

export interface COASyncResult {
  externalCode: string
  externalName: string
  accountType: string
  accountSubType?: string
  isActive: boolean
}
