import type { ConnectorDef } from "../types"

export const ryzhaConnector: ConnectorDef = {
  slug: "ryzha",
  name: "Ryzha",
  description: "Trigger on Ryzha ERP events, read financial data, or write records back into Ryzha.",
  category: "finance",
  color: "#6366f1",
  authType: "none",
  sortOrder: 0,
  triggers: [
    {
      slug: "invoice_posted",
      name: "Invoice Posted",
      description: "Fires when a customer invoice is posted to the GL.",
      inputSchema: [],
      outputSchema: {
        invoice: {
          id: "string",
          number: "string",
          status: "string",
          amount: "number",
          currency: "string",
          dueDate: "string",
          customerId: "string",
          customerName: "string",
          customerEmail: "string",
        },
      },
      sampleOutput: {
        invoice: {
          id: "inv_abc123",
          number: "INV-0042",
          status: "POSTED",
          amount: 4500,
          currency: "USD",
          dueDate: "2026-07-01",
          customerId: "cust_xyz",
          customerName: "Acme Corp",
          customerEmail: "ap@acme.com",
        },
      },
      sortOrder: 0,
    },
    {
      slug: "payment_received",
      name: "Payment Received",
      description: "Fires when a customer payment is recorded.",
      inputSchema: [],
      outputSchema: {
        payment: { id: "string", amount: "number", currency: "string", invoiceId: "string", customerId: "string", customerName: "string", method: "string" },
      },
      sampleOutput: {
        payment: { id: "pay_abc", amount: 4500, currency: "USD", invoiceId: "inv_abc123", customerId: "cust_xyz", customerName: "Acme Corp", method: "BANK_TRANSFER" },
      },
      sortOrder: 1,
    },
    {
      slug: "vendor_invoice_approved",
      name: "Vendor Invoice Approved",
      description: "Fires when a vendor invoice is approved via 3-way match or manual approval.",
      inputSchema: [],
      outputSchema: {
        vendorInvoice: { id: "string", number: "string", amount: "number", vendorId: "string", vendorName: "string", purchaseOrderId: "string" },
      },
      sampleOutput: {
        vendorInvoice: { id: "vi_abc", number: "VINV-0010", amount: 2500, vendorId: "vendor_xyz", vendorName: "Supplies Inc", purchaseOrderId: "po_abc" },
      },
      sortOrder: 2,
    },
    {
      slug: "sales_order_created",
      name: "Sales Order Created",
      description: "Fires when a new sales order is created.",
      inputSchema: [],
      outputSchema: {
        salesOrder: { id: "string", number: "string", amount: "number", customerId: "string", customerName: "string", status: "string" },
      },
      sampleOutput: {
        salesOrder: { id: "so_abc", number: "SO-0001", amount: 9800, customerId: "cust_xyz", customerName: "Acme Corp", status: "DRAFT" },
      },
      sortOrder: 3,
    },
    {
      slug: "period_closed",
      name: "Accounting Period Closed",
      description: "Fires when an accounting period is closed.",
      inputSchema: [],
      outputSchema: {
        period: { id: "string", name: "string", startDate: "string", endDate: "string" },
      },
      sampleOutput: {
        period: { id: "ap_abc", name: "May 2026", startDate: "2026-05-01", endDate: "2026-05-31" },
      },
      sortOrder: 4,
    },
    {
      slug: "customer_created",
      name: "Customer Created",
      description: "Fires when a new customer is added to Ryzha.",
      inputSchema: [],
      outputSchema: {
        customer: { id: "string", name: "string", email: "string", currency: "string", country: "string" },
      },
      sampleOutput: {
        customer: { id: "cust_xyz", name: "Acme Corp", email: "ap@acme.com", currency: "USD", country: "US" },
      },
      sortOrder: 5,
    },
  ],
  actions: [
    {
      slug: "query_gl",
      name: "Query General Ledger",
      description: "Fetch GL entries filtered by account type, date range, or account name.",
      inputSchema: [
        { key: "accountType", label: "Account Type", type: "select", options: [{ label: "All", value: "" }, { label: "Assets", value: "Assets" }, { label: "Liabilities", value: "Liabilities" }, { label: "Revenue", value: "Revenue" }, { label: "Expenses", value: "Expenses" }, { label: "COGS", value: "COGS" }], supportsDataPills: false },
        { key: "dateFrom", label: "Date From", type: "text", placeholder: "2026-01-01", supportsDataPills: true },
        { key: "dateTo", label: "Date To", type: "text", placeholder: "2026-12-31", supportsDataPills: true },
        { key: "limit", label: "Max Records", type: "number", placeholder: "100" },
      ],
      outputSchema: { entries: [{ id: "string", accountName: "string", accountType: "string", debit: "number", credit: "number", date: "string", description: "string" }], totalCount: "number" },
      sampleOutput: { entries: [{ id: "gl_abc", accountName: "Revenue", accountType: "Revenue", debit: 0, credit: 4500, date: "2026-05-15", description: "Invoice payment" }], totalCount: 1 },
      sortOrder: 0,
    },
    {
      slug: "fetch_report",
      name: "Fetch Financial Report",
      description: "Generate a P&L, Balance Sheet, AR Aging, or AP Aging report as structured data.",
      inputSchema: [
        { key: "reportType", label: "Report", type: "select", required: true, options: [{ label: "Profit & Loss", value: "pl" }, { label: "Balance Sheet", value: "bs" }, { label: "AR Aging", value: "ar_aging" }, { label: "AP Aging", value: "ap_aging" }, { label: "Trial Balance", value: "trial_balance" }] },
        { key: "dateFrom", label: "From Date", type: "text", placeholder: "2026-01-01", supportsDataPills: true },
        { key: "dateTo", label: "To Date", type: "text", placeholder: "2026-12-31", supportsDataPills: true },
      ],
      outputSchema: { reportType: "string", asOf: "string", data: "object" },
      sampleOutput: { reportType: "pl", asOf: "2026-05-31", data: { revenue: 45000, cogs: 12000, grossProfit: 33000, expenses: 8000, netIncome: 25000 } },
      sortOrder: 1,
    },
    {
      slug: "create_journal_entry",
      name: "Create Journal Entry",
      description: "Post a manual journal entry to the GL.",
      inputSchema: [
        { key: "description", label: "Description", type: "text", required: true, supportsDataPills: true },
        { key: "date", label: "Date (YYYY-MM-DD)", type: "text", required: true, supportsDataPills: true },
        { key: "lines", label: "Lines (JSON array)", type: "textarea", required: true, helpText: '[{"accountId":"...","debit":100,"credit":0,"description":"..."}]', supportsDataPills: true },
      ],
      outputSchema: { journalEntry: { id: "string", number: "string", status: "string" } },
      sampleOutput: { journalEntry: { id: "je_abc", number: "JE-0001", status: "POSTED" } },
      sortOrder: 2,
    },
    {
      slug: "create_customer",
      name: "Create Customer",
      description: "Add a new customer to Ryzha master data.",
      inputSchema: [
        { key: "name", label: "Customer Name", type: "text", required: true, supportsDataPills: true },
        { key: "email", label: "Email", type: "text", supportsDataPills: true },
        { key: "currency", label: "Currency", type: "text", placeholder: "USD", supportsDataPills: true },
        { key: "country", label: "Country Code", type: "text", placeholder: "US", supportsDataPills: true },
      ],
      outputSchema: { customer: { id: "string", name: "string", email: "string" } },
      sampleOutput: { customer: { id: "cust_new", name: "New Corp", email: "billing@newcorp.com" } },
      sortOrder: 3,
    },
    {
      slug: "create_invoice",
      name: "Create Invoice",
      description: "Create a new customer invoice in Ryzha.",
      inputSchema: [
        { key: "customerId", label: "Customer ID", type: "text", required: true, supportsDataPills: true },
        { key: "amount", label: "Amount", type: "number", required: true, supportsDataPills: true },
        { key: "currency", label: "Currency", type: "text", placeholder: "USD", supportsDataPills: true },
        { key: "dueDate", label: "Due Date (YYYY-MM-DD)", type: "text", supportsDataPills: true },
        { key: "description", label: "Description", type: "text", supportsDataPills: true },
      ],
      outputSchema: { invoice: { id: "string", number: "string", status: "string" } },
      sampleOutput: { invoice: { id: "inv_new", number: "INV-0043", status: "DRAFT" } },
      sortOrder: 4,
    },
  ],
}
