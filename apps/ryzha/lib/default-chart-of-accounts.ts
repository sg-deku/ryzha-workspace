export interface DefaultAccount {
  accountCode: string
  accountName: string
  accountType: string
  categoryMatch: string | null
  isSystem: boolean
}

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccount[] = [
  // ── Assets ───────────────────────────────────────────────────────────────────
  { accountCode: "1000", accountName: "Cash",                         accountType: "Assets",        categoryMatch: "cash",               isSystem: true },
  { accountCode: "1010", accountName: "Stripe Clearing",              accountType: "Assets",        categoryMatch: "stripe_clearing",    isSystem: true },
  { accountCode: "1100", accountName: "Accounts Receivable",          accountType: "Assets",        categoryMatch: "accounts_receivable", isSystem: true },
  { accountCode: "1200", accountName: "Prepaid Expenses",             accountType: "Assets",        categoryMatch: null,                 isSystem: true },
  { accountCode: "1500", accountName: "Fixed Assets",                 accountType: "Assets",        categoryMatch: "fixed_assets",       isSystem: true },
  { accountCode: "1510", accountName: "Accumulated Depreciation",     accountType: "Assets",        categoryMatch: null,                 isSystem: true },

  // ── Liabilities ───────────────────────────────────────────────────────────────
  { accountCode: "2000", accountName: "Accounts Payable",             accountType: "Liabilities",   categoryMatch: "accounts_payable",   isSystem: true },
  { accountCode: "2100", accountName: "Undeposited Funds",            accountType: "Liabilities",   categoryMatch: "undeposited_funds",  isSystem: true },
  { accountCode: "2200", accountName: "Deferred Revenue",             accountType: "Liabilities",   categoryMatch: "deferred_revenue",   isSystem: true },
  { accountCode: "2300", accountName: "Revenue Suspense",             accountType: "Liabilities",   categoryMatch: "revenue_suspense",   isSystem: true },
  { accountCode: "2400", accountName: "Sales Tax Payable",            accountType: "Liabilities",   categoryMatch: "sales_tax",          isSystem: true },

  // ── Equity ───────────────────────────────────────────────────────────────────
  { accountCode: "3000", accountName: "Owner's Equity",               accountType: "Equity",        categoryMatch: null,                 isSystem: true },
  { accountCode: "3200", accountName: "Retained Earnings",            accountType: "Equity",        categoryMatch: null,                 isSystem: true },

  // ── Revenue ───────────────────────────────────────────────────────────────────
  { accountCode: "4000", accountName: "Subscription Revenue",         accountType: "Revenue",       categoryMatch: "service_revenue",    isSystem: true },
  { accountCode: "4100", accountName: "Service Revenue",              accountType: "Revenue",       categoryMatch: null,                 isSystem: true },
  { accountCode: "4200", accountName: "Product Revenue",              accountType: "Revenue",       categoryMatch: null,                 isSystem: true },
  { accountCode: "4900", accountName: "Other Revenue",                accountType: "Revenue",       categoryMatch: null,                 isSystem: true },

  // ── COGS (5xxx) ───────────────────────────────────────────────────────────────
  { accountCode: "5000", accountName: "Cost of Goods Sold",           accountType: "COGS",          categoryMatch: "cogs",               isSystem: true },
  { accountCode: "5100", accountName: "Cost of Revenue",              accountType: "COGS",          categoryMatch: null,                 isSystem: true },
  { accountCode: "5200", accountName: "Direct Labor",                 accountType: "COGS",          categoryMatch: null,                 isSystem: true },
  { accountCode: "5300", accountName: "Cloud Infrastructure (COGS)",  accountType: "COGS",          categoryMatch: null,                 isSystem: true },

  // ── Operating Expenses (6xxx) ─────────────────────────────────────────────────
  { accountCode: "6000", accountName: "Salaries & Payroll",           accountType: "Expenses",      categoryMatch: "payroll",            isSystem: true },
  { accountCode: "6100", accountName: "Software & SaaS",              accountType: "Expenses",      categoryMatch: "software",           isSystem: true },
  { accountCode: "6200", accountName: "Marketing & Advertising",      accountType: "Expenses",      categoryMatch: "marketing",          isSystem: true },
  { accountCode: "6300", accountName: "Professional Services",        accountType: "Expenses",      categoryMatch: null,                 isSystem: true },
  { accountCode: "6400", accountName: "Travel & Entertainment",       accountType: "Expenses",      categoryMatch: null,                 isSystem: true },
  { accountCode: "6500", accountName: "Office & Admin",               accountType: "Expenses",      categoryMatch: null,                 isSystem: true },
  { accountCode: "6600", accountName: "Cloud & Hosting",              accountType: "Expenses",      categoryMatch: null,                 isSystem: true },
  { accountCode: "6700", accountName: "Depreciation Expense",         accountType: "Expenses",      categoryMatch: null,                 isSystem: true },
  { accountCode: "6800", accountName: "Bank Fees",                    accountType: "Expenses",      categoryMatch: "bank_fees",          isSystem: true },
  { accountCode: "6900", accountName: "Other Expenses",               accountType: "Expenses",      categoryMatch: null,                 isSystem: true },

  // ── Other Income / Expense (7xxx) ─────────────────────────────────────────────
  { accountCode: "7000", accountName: "Interest Income",              accountType: "Other Income",  categoryMatch: null,                 isSystem: true },
  { accountCode: "7100", accountName: "FX Gain",                      accountType: "Other Income",  categoryMatch: null,                 isSystem: true },
  { accountCode: "7200", accountName: "Interest Expense",             accountType: "Other Expense", categoryMatch: null,                 isSystem: true },
  { accountCode: "7300", accountName: "FX Loss",                      accountType: "Other Expense", categoryMatch: null,                 isSystem: true },
  { accountCode: "7400", accountName: "Foreign Exchange Expense",     accountType: "Other Expense", categoryMatch: null,                 isSystem: true },
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
