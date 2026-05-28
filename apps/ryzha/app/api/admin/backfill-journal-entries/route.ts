import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { mapInvoiceToAccount, mapExpenseCategoryToAccount, mapVendorInvoiceToAccount } from "@/lib/reports/general-ledger/account-mapping"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId
  const results = { invoices: 0, expenses: 0, vendorInvoices: 0, transactions: 0, errors: 0 }

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: orgId },
    include: { lineItems: true },
  })
  for (const invoice of invoices) {
    try {
      const jeLines: any[] = [
        {
          accountName: "Accounts Receivable",
          accountType: "Assets",
          debit: invoice.total,
          credit: 0,
          description: `${invoice.invoiceNumber} – Amount due (${invoice.clientName})`,
        },
      ]
      for (const li of invoice.lineItems) {
        jeLines.push({
          accountName: mapInvoiceToAccount(li.description),
          accountType: "Revenue",
          debit: 0,
          credit: li.amount,
          description: `${invoice.invoiceNumber} – ${li.description}`,
        })
      }
      if (invoice.totalTax > 0) {
        jeLines.push({
          accountName: "Tax Payable",
          accountType: "Liabilities",
          debit: 0,
          credit: invoice.totalTax,
          description: `${invoice.invoiceNumber} – Sales Tax`,
        })
      }
      await createSystemJournalEntry({
        organizationId: orgId,
        sourceType: "Invoice",
        sourceId: invoice.id,
        reference: invoice.invoiceNumber,
        description: `Invoice issued – ${invoice.clientName}`,
        entryDate: invoice.issueDate,
        lines: jeLines,
      })
      results.invoices++
    } catch {
      results.errors++
    }
  }

  const expenses = await prisma.expense.findMany({ where: { organizationId: orgId } })
  for (const expense of expenses) {
    try {
      await createSystemJournalEntry({
        organizationId: orgId,
        sourceType: "Expense",
        sourceId: expense.id,
        reference: `EXP-${expense.id.slice(-6)}`,
        description: `Expense – ${expense.description}`,
        entryDate: expense.date,
        lines: [
          {
            accountName: mapExpenseCategoryToAccount(expense.category),
            accountType: "Expenses",
            debit: expense.amount,
            credit: 0,
            description: expense.description,
          },
          {
            accountName: "Cash",
            accountType: "Assets",
            debit: 0,
            credit: expense.amount,
            description: `Cash paid – ${expense.description}`,
          },
        ],
      })
      results.expenses++
    } catch {
      results.errors++
    }
  }

  const vendorInvoices = await prisma.vendorInvoice.findMany({
    where: { organizationId: orgId },
    include: { vendor: true, lineItems: true },
  })
  for (const vi of vendorInvoices) {
    try {
      const jeLines: any[] = []
      if (vi.lineItems.length > 0) {
        for (const item of vi.lineItems) {
          jeLines.push({
            accountName: mapVendorInvoiceToAccount(vi.vendor.name, item.description),
            accountType: "Expenses",
            debit: item.amount,
            credit: 0,
            description: `${vi.invoiceNumber} – ${item.description}`,
          })
        }
      } else {
        jeLines.push({
          accountName: mapVendorInvoiceToAccount(vi.vendor.name),
          accountType: "Expenses",
          debit: vi.amount,
          credit: 0,
          description: `${vi.invoiceNumber} – ${vi.vendor.name}`,
        })
      }
      jeLines.push({
        accountName: "Accounts Payable",
        accountType: "Liabilities",
        debit: 0,
        credit: vi.amount,
        description: `${vi.invoiceNumber} – Amount owed to ${vi.vendor.name}`,
      })
      await createSystemJournalEntry({
        organizationId: orgId,
        sourceType: "VendorInvoice",
        sourceId: vi.id,
        reference: vi.invoiceNumber,
        description: `Vendor invoice – ${vi.vendor.name}`,
        entryDate: vi.createdAt,
        lines: jeLines,
      })
      results.vendorInvoices++
    } catch {
      results.errors++
    }
  }

  const transactions = await prisma.transaction.findMany({ where: { organizationId: orgId } })
  for (const tx of transactions) {
    try {
      const stripeNet = tx.stripeNet ?? tx.amount
      const stripeFee = tx.stripeFee ?? 0
      const fxFee = tx.fxFee ?? 0
      const paymentDate = tx.createdAt

      const jeLines: any[] = [
        {
          accountName: "Stripe Clearing Account",
          accountType: "Assets",
          debit: stripeNet,
          credit: 0,
          description: `Stripe clearing – ${tx.stripePaymentIntentId}`,
        },
      ]
      if (stripeFee > 0) jeLines.push({ accountName: "Merchant Processing Fees", accountType: "Expenses", debit: stripeFee, credit: 0 })
      if (fxFee > 0) jeLines.push({ accountName: "Foreign Exchange Expense", accountType: "Expenses", debit: fxFee, credit: 0 })

      if (tx.invoiceId) {
        jeLines.push({ accountName: "Accounts Receivable", accountType: "Assets", debit: 0, credit: tx.amount })
      } else {
        jeLines.push({ accountName: "Subscription Revenue", accountType: "Revenue", debit: 0, credit: tx.amount })
      }

      await createSystemJournalEntry({
        organizationId: orgId,
        sourceType: "StripePayment",
        sourceId: tx.stripePaymentIntentId ?? tx.id,
        reference: `PAY-${(tx.stripePaymentIntentId ?? tx.id).slice(-8)}`,
        description: `Stripe payment – ${tx.customerEmail ?? tx.id}`,
        entryDate: paymentDate,
        lines: jeLines,
      })

      if (tx.clearingStatus === "paid_out" && tx.payoutDate && tx.payoutId) {
        await createSystemJournalEntry({
          organizationId: orgId,
          sourceType: "StripePayout",
          sourceId: `${tx.payoutId}-${tx.id}`,
          reference: `PAYOUT-${tx.payoutId.slice(-8)}`,
          description: `Stripe payout to bank – ${tx.payoutId}`,
          entryDate: tx.payoutDate,
          lines: [
            { accountName: "Cash", accountType: "Assets", debit: stripeNet, credit: 0 },
            { accountName: "Stripe Clearing Account", accountType: "Assets", debit: 0, credit: stripeNet },
          ],
        })
      }

      results.transactions++
    } catch {
      results.errors++
    }
  }

  return NextResponse.json({
    message: "Backfill complete",
    results,
  })
}
