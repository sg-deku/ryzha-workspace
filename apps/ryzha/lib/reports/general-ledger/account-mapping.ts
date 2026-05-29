import { prisma } from "@/lib/prisma"

export type AccountType = "Revenue" | "Expenses" | "Assets" | "Liabilities" | "Equity"

export interface AccountMapping {
  accountName: string
  accountType: AccountType
}

export const DEFAULT_CHART_OF_ACCOUNTS: AccountMapping[] = [
  { accountName: "Subscription Revenue", accountType: "Revenue" },
  { accountName: "Service Revenue", accountType: "Revenue" },
  { accountName: "Product Revenue", accountType: "Revenue" },
  { accountName: "Other Revenue", accountType: "Revenue" },
  { accountName: "Cloud & Hosting", accountType: "Expenses" },
  { accountName: "Software & SaaS", accountType: "Expenses" },
  { accountName: "Marketing & Advertising", accountType: "Expenses" },
  { accountName: "Travel & Entertainment", accountType: "Expenses" },
  { accountName: "Office & Admin", accountType: "Expenses" },
  { accountName: "Salaries & Payroll", accountType: "Expenses" },
  { accountName: "Professional Services", accountType: "Expenses" },
  { accountName: "Vendor Expense", accountType: "Expenses" },
  { accountName: "Other Expenses", accountType: "Expenses" },
  { accountName: "Cash", accountType: "Assets" },
  { accountName: "Accounts Receivable", accountType: "Assets" },
  { accountName: "Stripe Clearing Account", accountType: "Assets" },
  { accountName: "Prepaid Expenses", accountType: "Assets" },
  { accountName: "Accounts Payable", accountType: "Liabilities" },
  { accountName: "Deferred Revenue", accountType: "Liabilities" },
  { accountName: "Tax Payable", accountType: "Liabilities" },
  { accountName: "Retained Earnings", accountType: "Equity" },
  { accountName: "Merchant Processing Fees", accountType: "Expenses" },
  { accountName: "Foreign Exchange Expense", accountType: "Expenses" },
  { accountName: "Stripe Reconciliation Difference", accountType: "Expenses" },
]

const EXPENSE_CATEGORY_MAP: Record<string, string> = {
  "Software": "Software & SaaS",
  "SaaS": "Software & SaaS",
  "Cloud": "Cloud & Hosting",
  "Hosting": "Cloud & Hosting",
  "Marketing": "Marketing & Advertising",
  "Advertising": "Marketing & Advertising",
  "Travel": "Travel & Entertainment",
  "Entertainment": "Travel & Entertainment",
  "Office": "Office & Admin",
  "Admin": "Office & Admin",
  "Salary": "Salaries & Payroll",
  "Payroll": "Salaries & Payroll",
  "Consulting": "Professional Services",
  "Legal": "Professional Services",
  "Accounting": "Professional Services",
}

export function mapExpenseCategoryToAccount(category?: string | null): string {
  if (!category) return "Other Expenses"
  for (const [key, account] of Object.entries(EXPENSE_CATEGORY_MAP)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return account
    }
  }
  return "Other Expenses"
}

export function mapInvoiceToAccount(description?: string): string {
  if (!description) return "Service Revenue"
  const lower = description.toLowerCase()
  if (lower.includes("subscription") || lower.includes("saas") || lower.includes("plan")) {
    return "Subscription Revenue"
  }
  if (lower.includes("product") || lower.includes("hardware")) {
    return "Product Revenue"
  }
  return "Service Revenue"
}

export function mapVendorInvoiceToAccount(vendorName?: string, description?: string): string {
  if (!vendorName && !description) return "Vendor Expense"
  const text = `${vendorName || ""} ${description || ""}`.toLowerCase()
  if (text.includes("cloud") || text.includes("aws") || text.includes("gcp") || text.includes("azure")) {
    return "Cloud & Hosting"
  }
  if (text.includes("software") || text.includes("saas") || text.includes("subscription")) {
    return "Software & SaaS"
  }
  if (text.includes("marketing") || text.includes("ads") || text.includes("advertising")) {
    return "Marketing & Advertising"
  }
  if (text.includes("legal") || text.includes("consult") || text.includes("account")) {
    return "Professional Services"
  }
  return "Vendor Expense"
}

const _resolveCache = new Map<string, string>()

export async function resolveAccountName(
  organizationId: string,
  defaultName: string
): Promise<string> {
  const cacheKey = `${organizationId}:${defaultName}`
  if (_resolveCache.has(cacheKey)) return _resolveCache.get(cacheKey)!
  const acct = await prisma.chartOfAccounts.findFirst({
    where: { organizationId, accountName: defaultName },
    select: { accountName: true },
  })
  const resolved = acct?.accountName ?? defaultName
  _resolveCache.set(cacheKey, resolved)
  return resolved
}

export function clearAccountCache() {
  _resolveCache.clear()
}

export function getAccountTypeForName(accountName: string): AccountType {
  const acct = DEFAULT_CHART_OF_ACCOUNTS.find((a) => a.accountName === accountName)
  return acct?.accountType ?? "Expenses"
}
