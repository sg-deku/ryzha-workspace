export interface DefaultAccount {
  accountCode: string
  accountName: string
  accountType: string
  categoryMatch: string | null
}

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccount[] = [
  // ── Assets ───────────────────────────────────────────────────────────────────
  { accountCode: "1000", accountName: "Cash",                  accountType: "Assets",      categoryMatch: "cash" },
  { accountCode: "1010", accountName: "Stripe Clearing",       accountType: "Assets",      categoryMatch: "stripe_clearing" },
  { accountCode: "1100", accountName: "Accounts Receivable",   accountType: "Assets",      categoryMatch: "accounts_receivable" },

  // ── Liabilities ───────────────────────────────────────────────────────────────
  { accountCode: "2000", accountName: "Accounts Payable",      accountType: "Liabilities", categoryMatch: "accounts_payable" },
  { accountCode: "2100", accountName: "Undeposited Funds",     accountType: "Liabilities", categoryMatch: "undeposited_funds" },
  { accountCode: "2200", accountName: "Deferred Revenue",      accountType: "Liabilities", categoryMatch: "deferred_revenue" },
  { accountCode: "2300", accountName: "Revenue Suspense",      accountType: "Liabilities", categoryMatch: "revenue_suspense" },
  { accountCode: "2400", accountName: "Sales Tax Payable",     accountType: "Liabilities", categoryMatch: "sales_tax" },

  // ── Equity ───────────────────────────────────────────────────────────────────
  { accountCode: "3000", accountName: "Owner's Equity",        accountType: "Equity",      categoryMatch: null },
  { accountCode: "3200", accountName: "Retained Earnings",     accountType: "Equity",      categoryMatch: null },

  // ── Revenue ───────────────────────────────────────────────────────────────────
  { accountCode: "4000", accountName: "Revenue",               accountType: "Revenue",     categoryMatch: "service_revenue" },
  { accountCode: "4100", accountName: "Other Revenue",         accountType: "Revenue",     categoryMatch: null },

  // ── Expenses ──────────────────────────────────────────────────────────────────
  { accountCode: "5000", accountName: "Cost of Goods Sold",    accountType: "Expenses",    categoryMatch: "cogs" },
  { accountCode: "5100", accountName: "Payroll",               accountType: "Expenses",    categoryMatch: "payroll" },
  { accountCode: "5200", accountName: "Software & SaaS",       accountType: "Expenses",    categoryMatch: "software" },
  { accountCode: "5300", accountName: "Marketing",             accountType: "Expenses",    categoryMatch: "marketing" },
  { accountCode: "5400", accountName: "Bank Fees",             accountType: "Expenses",    categoryMatch: "bank_fees" },
  { accountCode: "5500", accountName: "Other Expenses",        accountType: "Expenses",    categoryMatch: null },
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
      organizationId,
    })),
    skipDuplicates: true,
  })
}
