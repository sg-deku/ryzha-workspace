export interface DefaultAccount {
  accountCode: string
  accountName: string
  accountType: string
  categoryMatch: string | null
}

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccount[] = [
  // ── Assets ─────────────────────────────────────────────────────────────────
  { accountCode: "1000", accountName: "Cash and Cash Equivalents",     accountType: "Assets",      categoryMatch: null },
  { accountCode: "1100", accountName: "Accounts Receivable",           accountType: "Assets",      categoryMatch: "accounts_receivable" },
  { accountCode: "1150", accountName: "Allowance for Doubtful Accounts", accountType: "Assets",    categoryMatch: null },
  { accountCode: "1200", accountName: "Prepaid Expenses",              accountType: "Assets",      categoryMatch: "prepaid" },
  { accountCode: "1300", accountName: "Inventory",                     accountType: "Assets",      categoryMatch: "inventory" },
  { accountCode: "1400", accountName: "Other Current Assets",          accountType: "Assets",      categoryMatch: null },
  { accountCode: "1500", accountName: "Fixed Assets — Equipment",      accountType: "Assets",      categoryMatch: null },
  { accountCode: "1510", accountName: "Fixed Assets — Furniture",      accountType: "Assets",      categoryMatch: null },
  { accountCode: "1520", accountName: "Fixed Assets — Computers",      accountType: "Assets",      categoryMatch: null },
  { accountCode: "1600", accountName: "Accumulated Depreciation",      accountType: "Assets",      categoryMatch: null },
  { accountCode: "1700", accountName: "Intangible Assets",             accountType: "Assets",      categoryMatch: null },
  { accountCode: "1800", accountName: "Other Non-Current Assets",      accountType: "Assets",      categoryMatch: null },

  // ── Liabilities ─────────────────────────────────────────────────────────────
  { accountCode: "2000", accountName: "Accounts Payable",              accountType: "Liabilities", categoryMatch: "accounts_payable" },
  { accountCode: "2100", accountName: "Accrued Liabilities",           accountType: "Liabilities", categoryMatch: null },
  { accountCode: "2150", accountName: "Payroll Liabilities",           accountType: "Liabilities", categoryMatch: "payroll" },
  { accountCode: "2200", accountName: "Deferred Revenue",              accountType: "Liabilities", categoryMatch: "deferred_revenue" },
  { accountCode: "2300", accountName: "Credit Cards Payable",          accountType: "Liabilities", categoryMatch: null },
  { accountCode: "2400", accountName: "Sales Tax Payable",             accountType: "Liabilities", categoryMatch: "tax" },
  { accountCode: "2500", accountName: "Income Tax Payable",            accountType: "Liabilities", categoryMatch: "tax" },
  { accountCode: "2600", accountName: "Current Portion of Long-Term Debt", accountType: "Liabilities", categoryMatch: null },
  { accountCode: "2700", accountName: "Long-Term Debt",                accountType: "Liabilities", categoryMatch: null },
  { accountCode: "2800", accountName: "Other Long-Term Liabilities",   accountType: "Liabilities", categoryMatch: null },

  // ── Equity ───────────────────────────────────────────────────────────────────
  { accountCode: "3000", accountName: "Common Stock",                  accountType: "Equity",      categoryMatch: null },
  { accountCode: "3100", accountName: "Additional Paid-In Capital",    accountType: "Equity",      categoryMatch: null },
  { accountCode: "3200", accountName: "Retained Earnings",             accountType: "Equity",      categoryMatch: null },
  { accountCode: "3300", accountName: "Owner Distributions",           accountType: "Equity",      categoryMatch: null },
  { accountCode: "3400", accountName: "Accumulated Other Comprehensive Income", accountType: "Equity", categoryMatch: null },

  // ── Revenue ──────────────────────────────────────────────────────────────────
  { accountCode: "4000", accountName: "Product Revenue",               accountType: "Revenue",     categoryMatch: "product_revenue" },
  { accountCode: "4100", accountName: "Service Revenue",               accountType: "Revenue",     categoryMatch: "service_revenue" },
  { accountCode: "4200", accountName: "Subscription Revenue",          accountType: "Revenue",     categoryMatch: "subscription_revenue" },
  { accountCode: "4300", accountName: "Professional Services Revenue", accountType: "Revenue",     categoryMatch: "professional_services" },
  { accountCode: "4400", accountName: "License Revenue",               accountType: "Revenue",     categoryMatch: null },
  { accountCode: "4900", accountName: "Other Revenue",                 accountType: "Revenue",     categoryMatch: null },

  // ── Expenses ─────────────────────────────────────────────────────────────────
  { accountCode: "5000", accountName: "Cost of Goods Sold",            accountType: "Expenses",    categoryMatch: "cogs" },
  { accountCode: "5100", accountName: "Payroll & Salaries",            accountType: "Expenses",    categoryMatch: "payroll" },
  { accountCode: "5110", accountName: "Contractor & Freelancer Costs", accountType: "Expenses",    categoryMatch: "contractor" },
  { accountCode: "5120", accountName: "Employee Benefits",             accountType: "Expenses",    categoryMatch: "benefits" },
  { accountCode: "5200", accountName: "Marketing & Advertising",       accountType: "Expenses",    categoryMatch: "marketing" },
  { accountCode: "5300", accountName: "Software & Subscriptions",      accountType: "Expenses",    categoryMatch: "software" },
  { accountCode: "5310", accountName: "Cloud Infrastructure",          accountType: "Expenses",    categoryMatch: "infrastructure" },
  { accountCode: "5400", accountName: "Office & Facilities",           accountType: "Expenses",    categoryMatch: "office" },
  { accountCode: "5410", accountName: "Rent & Lease",                  accountType: "Expenses",    categoryMatch: "rent" },
  { accountCode: "5420", accountName: "Utilities",                     accountType: "Expenses",    categoryMatch: "utilities" },
  { accountCode: "5500", accountName: "Travel & Entertainment",        accountType: "Expenses",    categoryMatch: "travel" },
  { accountCode: "5510", accountName: "Meals & Entertainment",         accountType: "Expenses",    categoryMatch: "meals" },
  { accountCode: "5600", accountName: "Professional Services",         accountType: "Expenses",    categoryMatch: "professional_services" },
  { accountCode: "5610", accountName: "Legal & Compliance",            accountType: "Expenses",    categoryMatch: "legal" },
  { accountCode: "5620", accountName: "Accounting & Audit",            accountType: "Expenses",    categoryMatch: "accounting" },
  { accountCode: "5700", accountName: "Depreciation & Amortization",   accountType: "Expenses",    categoryMatch: null },
  { accountCode: "5800", accountName: "Insurance",                     accountType: "Expenses",    categoryMatch: "insurance" },
  { accountCode: "5900", accountName: "Interest Expense",              accountType: "Expenses",    categoryMatch: "interest" },
  { accountCode: "5910", accountName: "Bank Fees & Charges",           accountType: "Expenses",    categoryMatch: "bank_fees" },
  { accountCode: "5950", accountName: "Bad Debt Expense",              accountType: "Expenses",    categoryMatch: null },
  { accountCode: "6000", accountName: "Other Operating Expenses",      accountType: "Expenses",    categoryMatch: null },
]
