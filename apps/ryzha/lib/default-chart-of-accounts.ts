export interface DefaultAccount {
  accountCode: string
  accountName: string
  accountType: string
  categoryMatch: string | null
  isSystem: boolean
}

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccount[] = [
  // ── Assets ───────────────────────────────────────────────────────────────────
  { accountCode: "1000", accountName: "Cash",                  accountType: "Assets",      categoryMatch: "cash",               isSystem: true },
  { accountCode: "1010", accountName: "Stripe Clearing",       accountType: "Assets",      categoryMatch: "stripe_clearing",    isSystem: true },
  { accountCode: "1100", accountName: "Accounts Receivable",   accountType: "Assets",      categoryMatch: "accounts_receivable", isSystem: true },

  // ── Liabilities ───────────────────────────────────────────────────────────────
  { accountCode: "2000", accountName: "Accounts Payable",      accountType: "Liabilities", categoryMatch: "accounts_payable",   isSystem: true },
  { accountCode: "2100", accountName: "Undeposited Funds",     accountType: "Liabilities", categoryMatch: "undeposited_funds",  isSystem: true },
  { accountCode: "2200", accountName: "Deferred Revenue",      accountType: "Liabilities", categoryMatch: "deferred_revenue",   isSystem: true },
  { accountCode: "2300", accountName: "Revenue Suspense",      accountType: "Liabilities", categoryMatch: "revenue_suspense",   isSystem: true },
  { accountCode: "2400", accountName: "Sales Tax Payable",     accountType: "Liabilities", categoryMatch: "sales_tax",          isSystem: true },

  // ── Equity ───────────────────────────────────────────────────────────────────
  { accountCode: "3000", accountName: "Owner's Equity",        accountType: "Equity",      categoryMatch: null,                 isSystem: true },
  { accountCode: "3200", accountName: "Retained Earnings",     accountType: "Equity",      categoryMatch: null,                 isSystem: true },

  // ── Revenue ───────────────────────────────────────────────────────────────────
  { accountCode: "4000", accountName: "Revenue",               accountType: "Revenue",     categoryMatch: "service_revenue",    isSystem: true },
  { accountCode: "4100", accountName: "Other Revenue",         accountType: "Revenue",     categoryMatch: null,                 isSystem: true },

  // ── Expenses ──────────────────────────────────────────────────────────────────
  { accountCode: "5000", accountName: "Cost of Goods Sold",    accountType: "Expenses",    categoryMatch: "cogs",               isSystem: true },
  { accountCode: "5100", accountName: "Payroll",               accountType: "Expenses",    categoryMatch: "payroll",            isSystem: true },
  { accountCode: "5200", accountName: "Software & SaaS",       accountType: "Expenses",    categoryMatch: "software",           isSystem: true },
  { accountCode: "5300", accountName: "Marketing",             accountType: "Expenses",    categoryMatch: "marketing",          isSystem: true },
  { accountCode: "5400", accountName: "Bank Fees",             accountType: "Expenses",    categoryMatch: "bank_fees",          isSystem: true },
  { accountCode: "5500", accountName: "Other Expenses",        accountType: "Expenses",    categoryMatch: null,                 isSystem: true },
]

export async function seedDefaultChartOfAccounts(
  organizationId: string,
  tx: { chartOfAccounts: { createMany: (args: any) => Promise<any> } }
): Promise<void> {
  await tx.chartOfAccounts.createMany({
    data: DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
      accountCode: a.accountCode,
      accountName: a.accountName,
      accountType: a.accountType,
      categoryMatch: a.categoryMatch,
      isSystem: a.isSystem,
      organizationId,
    })),
    skipDuplicates: true,
  })
}
