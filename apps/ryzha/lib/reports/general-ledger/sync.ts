import { prisma } from "@/lib/prisma"
import {
  mapExpenseCategoryToAccount,
  mapInvoiceToAccount,
  mapVendorInvoiceToAccount,
} from "./account-mapping"

export async function syncGLForOrganization(organizationId: string) {
  await Promise.all([
    syncInvoices(organizationId),
    syncExpenses(organizationId),
    syncVendorInvoices(organizationId),
    syncTransactions(organizationId),
  ])
}

async function upsertGLEntry(data: {
  organizationId: string
  sourceType: string
  sourceId: string
  date: Date
  accountType: string
  accountName: string
  debit: number
  credit: number
  amount: number
  description: string
}) {
  const existing = await prisma.generalLedgerEntry.findFirst({
    where: {
      organizationId: data.organizationId,
      sourceId: data.sourceId,
      sourceType: data.sourceType,
      accountName: data.accountName,
    },
  })

  if (existing) {
    await prisma.generalLedgerEntry.update({
      where: { id: existing.id },
      data: {
        date: data.date,
        debit: data.debit,
        credit: data.credit,
        amount: data.amount,
        description: data.description,
        accountType: data.accountType,
        accountName: data.accountName,
      },
    })
  } else {
    await prisma.generalLedgerEntry.create({ data })
  }
}

async function syncInvoices(organizationId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { organizationId },
    include: { lineItems: true, payments: true },
  })

  for (const invoice of invoices) {
    for (const item of invoice.lineItems) {
      const accountName = mapInvoiceToAccount(item.description)
      await upsertGLEntry({
        organizationId,
        sourceType: "Invoice",
        sourceId: item.id,
        date: invoice.issueDate,
        accountType: "Revenue",
        accountName,
        debit: 0,
        credit: item.amount,
        amount: item.amount,
        description: `${invoice.invoiceNumber} – ${item.description} (${invoice.clientName})`,
      })
    }
    if (invoice.totalTax > 0) {
      await upsertGLEntry({
        organizationId,
        sourceType: "Invoice",
        sourceId: `${invoice.id}-tax`,
        date: invoice.issueDate,
        accountType: "Liabilities",
        accountName: "Tax Payable",
        debit: 0,
        credit: invoice.totalTax,
        amount: -invoice.totalTax,
        description: `${invoice.invoiceNumber} – Sales Tax (${invoice.clientName})`,
      })
    }
    await upsertGLEntry({
      organizationId,
      sourceType: "Invoice",
      sourceId: `${invoice.id}-ar`,
      date: invoice.issueDate,
      accountType: "Assets",
      accountName: "Accounts Receivable",
      debit: invoice.total,
      credit: 0,
      amount: invoice.total,
      description: `${invoice.invoiceNumber} – Amount due (${invoice.clientName})`,
    })

    for (const payment of invoice.payments) {
      await upsertGLEntry({
        organizationId,
        sourceType: "Payment",
        sourceId: `${payment.id}-ar-clear`,
        date: payment.paymentDate,
        accountType: "Assets",
        accountName: "Accounts Receivable",
        debit: 0,
        credit: payment.amount,
        amount: -payment.amount,
        description: `${invoice.invoiceNumber} – Payment received (${invoice.clientName})`,
      })
    }
  }
}

async function syncExpenses(organizationId: string) {
  const expenses = await prisma.expense.findMany({
    where: { organizationId },
  })

  for (const expense of expenses) {
    const accountName = mapExpenseCategoryToAccount(expense.category)
    await upsertGLEntry({
      organizationId,
      sourceType: "Expense",
      sourceId: expense.id,
      date: expense.date,
      accountType: "Expenses",
      accountName,
      debit: expense.amount,
      credit: 0,
      amount: expense.amount,
      description: expense.description,
    })
  }
}

async function syncVendorInvoices(organizationId: string) {
  const vendorInvoices = await prisma.vendorInvoice.findMany({
    where: { organizationId },
    include: { vendor: true, lineItems: true },
  })

  for (const vi of vendorInvoices) {
    if (vi.lineItems.length > 0) {
      for (const item of vi.lineItems) {
        const accountName = mapVendorInvoiceToAccount(vi.vendor.name, item.description)
        await upsertGLEntry({
          organizationId,
          sourceType: "VendorInvoice",
          sourceId: item.id,
          date: vi.createdAt,
          accountType: "Expenses",
          accountName,
          debit: item.amount,
          credit: 0,
          amount: item.amount,
          description: `${vi.invoiceNumber} – ${item.description} (${vi.vendor.name})`,
        })
      }
    } else {
      const accountName = mapVendorInvoiceToAccount(vi.vendor.name)
      await upsertGLEntry({
        organizationId,
        sourceType: "VendorInvoice",
        sourceId: vi.id,
        date: vi.createdAt,
        accountType: "Expenses",
        accountName,
        debit: vi.amount,
        credit: 0,
        amount: vi.amount,
        description: `${vi.invoiceNumber} – ${vi.vendor.name}`,
      })
    }
    await upsertGLEntry({
      organizationId,
      sourceType: "VendorInvoice",
      sourceId: `${vi.id}-ap`,
      date: vi.createdAt,
      accountType: "Liabilities",
      accountName: "Accounts Payable",
      debit: 0,
      credit: vi.amount,
      amount: -vi.amount,
      description: `${vi.invoiceNumber} – Amount owed (${vi.vendor.name})`,
    })
  }
}

async function syncTransactions(organizationId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { organizationId },
  })

  for (const tx of transactions) {
    const recognized = tx.recognizedRevenue ?? tx.amount
    const deferred = tx.deferredRevenue ?? 0

    await upsertGLEntry({
      organizationId,
      sourceType: "StripeTransaction",
      sourceId: tx.id,
      date: tx.createdAt,
      accountType: "Assets",
      accountName: "Cash",
      debit: tx.amount,
      credit: 0,
      amount: tx.amount,
      description: tx.description ?? `Stripe payment – ${tx.customerEmail ?? "unknown"}`,
    })

    if (!tx.invoiceId) {
      if (recognized > 0) {
        await upsertGLEntry({
          organizationId,
          sourceType: "StripeTransaction",
          sourceId: `${tx.id}-rev`,
          date: tx.createdAt,
          accountType: "Revenue",
          accountName: "Subscription Revenue",
          debit: 0,
          credit: recognized,
          amount: -recognized,
          description: `${tx.description ?? "Stripe payment"} – recognized revenue`,
        })
      }

      if (deferred > 0) {
        await upsertGLEntry({
          organizationId,
          sourceType: "StripeTransaction",
          sourceId: `${tx.id}-def`,
          date: tx.createdAt,
          accountType: "Liabilities",
          accountName: "Deferred Revenue",
          debit: 0,
          credit: deferred,
          amount: -deferred,
          description: `${tx.description ?? "Stripe payment"} – deferred revenue`,
        })
      }
    }
  }
}
