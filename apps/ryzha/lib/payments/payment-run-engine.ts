import { prisma } from "@/lib/prisma"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { generateSepaXml, validateSepaInputs } from "./sepa-generator"
import { generateNachaFile, validateAchInputs } from "./ach-generator"
import { generateBacsFile, validateBacsInputs } from "./bacs-generator"
import { format } from "date-fns"

export async function executePaymentRun(
  runId: string,
  organizationId: string,
  userId: string,
  userName: string
): Promise<{ succeeded: number; failed: number }> {
  const run = await prisma.paymentRun.findUnique({
    where: { id: runId, organizationId },
    include: {
      items: {
        include: {
          vendorInvoice: {
            include: {
              vendor: true,
              vendorPayments: { select: { amount: true } },
            },
          },
        },
      },
      bankAccount: true,
    },
  })

  if (!run) throw new Error("Payment run not found")
  if (run.status !== "APPROVED") throw new Error(`Cannot execute run with status ${run.status}`)

  await prisma.paymentRun.update({ where: { id: runId }, data: { status: "PROCESSING" } })

  let succeeded = 0
  let failed = 0

  for (const item of run.items) {
    if (item.status !== "PENDING") continue

    try {
      const invoice = item.vendorInvoice
      const totalPaid = invoice.vendorPayments.reduce((s, p) => s + p.amount, 0)
      const outstanding = invoice.amount - totalPaid

      if (item.amount > outstanding + 0.01) {
        throw new Error(`Payment $${item.amount} exceeds outstanding $${outstanding.toFixed(2)}`)
      }

      const vendorPayment = await prisma.vendorPayment.create({
        data: {
          vendorInvoiceId: item.vendorInvoiceId,
          amount: item.amount,
          paymentDate: run.paymentDate,
          method: run.format.toLowerCase(),
          referenceNumber: `${run.runNumber}-${item.id.slice(-6)}`,
          notes: `Batch payment run ${run.runNumber}`,
          createdById: userId,
          organizationId,
        },
      })

      const newTotalPaid = totalPaid + item.amount
      const isFullyPaid = newTotalPaid >= invoice.amount - 0.01

      await Promise.all([
        prisma.paymentRunItem.update({
          where: { id: item.id },
          data: { status: "PAID", vendorPaymentId: vendorPayment.id },
        }),
        prisma.vendorInvoice.update({
          where: { id: item.vendorInvoiceId },
          data: {
            status: isFullyPaid ? "PAID" : "MATCHED",
            paidDate: isFullyPaid ? run.paymentDate : undefined,
          },
        }),
        createSystemJournalEntry({
          organizationId,
          sourceType: "VendorPayment",
          sourceId: vendorPayment.id,
          reference: `VPAY-${vendorPayment.id.slice(-6)}`,
          description: `Batch payment – ${invoice.vendor.name} (${invoice.invoiceNumber}) via ${run.runNumber}`,
          entryDate: run.paymentDate,
          lines: [
            {
              accountName: "Accounts Payable",
              accountType: "Liabilities",
              debit: item.amount,
              credit: 0,
              description: `AP cleared – ${invoice.invoiceNumber}`,
            },
            {
              accountName: "Cash",
              accountType: "Assets",
              debit: 0,
              credit: item.amount,
              description: `Cash paid to ${invoice.vendor.name}`,
            },
          ],
        }),
      ])

      succeeded++
    } catch (err: any) {
      await prisma.paymentRunItem.update({
        where: { id: item.id },
        data: { status: "FAILED", failureReason: err.message ?? "Unknown error" },
      })
      failed++
    }
  }

  const finalStatus = failed === 0 ? "COMPLETED" : succeeded === 0 ? "PARTIALLY_FAILED" : "PARTIALLY_FAILED"

  const totalExecuted = run.items
    .filter((i) => i.status === "PENDING")
    .reduce((s, i) => s + i.amount, 0)

  await prisma.paymentRun.update({
    where: { id: runId },
    data: {
      status: finalStatus,
      executedAt: new Date(),
      totalAmount: run.items.reduce((s, i) => s + i.amount, 0),
    },
  })

  return { succeeded, failed }
}

export async function generatePaymentFile(
  runId: string,
  organizationId: string
): Promise<{ filename: string; content: string; mimeType: string }> {
  const run = await prisma.paymentRun.findUnique({
    where: { id: runId, organizationId },
    include: {
      items: {
        where: { status: "PAID" },
        include: { vendorInvoice: { include: { vendor: true } } },
      },
      bankAccount: true,
      organization: true,
    },
  })

  if (!run) throw new Error("Payment run not found")
  if (!run.bankAccount) throw new Error("No bank account linked to this payment run")

  const paymentDateStr = format(run.paymentDate, "yyyy-MM-dd")

  if (run.format === "SEPA") {
    const transactions = run.items.map((item, idx) => ({
      endToEndId: `${run.runNumber}-${String(idx + 1).padStart(3, "0")}`,
      amount: item.amount,
      creditor: {
        name: item.vendorInvoice.vendor.bankAccountName || item.vendorInvoice.vendor.name,
        iban: item.vendorInvoice.vendor.bankIban ?? "",
        bic: item.vendorInvoice.vendor.bankBic ?? "",
      },
      remittanceInfo: item.vendorInvoice.invoiceNumber,
    }))

    const params = {
      messageId: run.runNumber,
      creationDateTime: new Date().toISOString().slice(0, 19),
      paymentDate: paymentDateStr,
      debtor: {
        name: run.organization.name,
        iban: run.bankAccount.iban ?? "",
        bic: run.bankAccount.bic ?? "",
      },
      transactions,
    }

    const errors = validateSepaInputs(params)
    if (errors.length > 0) throw new Error(errors.join("; "))

    return {
      filename: `${run.runNumber}-sepa.xml`,
      content: generateSepaXml(params),
      mimeType: "application/xml",
    }
  }

  if (run.format === "ACH") {
    const entries = run.items.map((item) => ({
      receivingRoutingNumber: item.vendorInvoice.vendor.bankRoutingNumber ?? "",
      receivingAccountNumber: item.vendorInvoice.vendor.bankAccountNumber ?? "",
      receivingAccountType: "checking" as const,
      amount: item.amount,
      individualName: item.vendorInvoice.vendor.name,
      individualId: item.vendorInvoice.invoiceNumber,
    }))

    const params = {
      company: {
        name: run.organization.name,
        id: run.organization.id.slice(0, 10),
        routingNumber: run.bankAccount.routingNumber ?? "",
        accountNumber: run.bankAccount.accountNumber ?? "",
        accountType: "checking" as const,
      },
      effectiveDate: paymentDateStr,
      description: `AP ${run.runNumber}`,
      entries,
    }

    const errors = validateAchInputs(params)
    if (errors.length > 0) throw new Error(errors.join("; "))

    return {
      filename: `${run.runNumber}-ach.nacha`,
      content: generateNachaFile(params),
      mimeType: "text/plain",
    }
  }

  if (run.format === "BACS") {
    const entries = run.items.map((item) => ({
      destinationSortCode: item.vendorInvoice.vendor.bankSortCode ?? "",
      destinationAccountNumber: item.vendorInvoice.vendor.bankAccountNumber ?? "",
      destinationAccountName: item.vendorInvoice.vendor.bankAccountName || item.vendorInvoice.vendor.name,
      amount: item.amount,
      reference: item.vendorInvoice.invoiceNumber,
    }))

    const params = {
      processingDate: paymentDateStr,
      originatorSortCode: run.bankAccount.sortCode ?? "",
      originatorAccountNumber: run.bankAccount.accountNumber ?? "",
      originatorAccountName: run.organization.name,
      originatorReference: run.runNumber,
      entries,
    }

    const errors = validateBacsInputs(params)
    if (errors.length > 0) throw new Error(errors.join("; "))

    return {
      filename: `${run.runNumber}-bacs.txt`,
      content: generateBacsFile(params),
      mimeType: "text/plain",
    }
  }

  throw new Error(`File export not supported for format: ${run.format}. Use SEPA, ACH, or BACS.`)
}
