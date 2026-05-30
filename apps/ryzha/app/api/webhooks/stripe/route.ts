import { NextResponse, after } from "next/server"
import Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { startAgentWorkflow } from "@/lib/agents/orchestrator"
import { recalculateInvoiceStatus } from "@/lib/agents/o2c/cash-application"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"

export const dynamic = "force-dynamic"

async function resolveStripeAccounts(organizationId: string) {
  const accounts = await prisma.chartOfAccounts.findMany({
    where: {
      organizationId,
      categoryMatch: { in: ["stripe_clearing", "bank_fees", "accounts_receivable"] },
    },
    select: { categoryMatch: true, accountName: true },
  })
  const byCategory = Object.fromEntries(accounts.map((a) => [a.categoryMatch!, a.accountName]))
  return {
    stripeClearing: byCategory["stripe_clearing"] ?? "Stripe Clearing Account",
    bankFees: byCategory["bank_fees"] ?? "Bank Fees",
    accountsReceivable: byCategory["accounts_receivable"] ?? "Accounts Receivable",
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url)
  const queryOrgId = url.searchParams.get("orgId")

  let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  let stripe: Stripe | null = null

  if (queryOrgId) {
    const settings = await prisma.financialSettings.findUnique({
      where: { organizationId: queryOrgId },
      select: { stripeWebhookSecret: true, stripeSecretKey: true }
    })
    if (settings?.stripeWebhookSecret) webhookSecret = settings.stripeWebhookSecret
    if (settings?.stripeSecretKey) {
      stripe = new Stripe(settings.stripeSecretKey, {
        apiVersion: "2025-01-27.acacia" as any,
        typescript: true,
      })
    }
  }

  if (!stripe) {
    try {
      stripe = getStripe()
    } catch (e) {
      console.error("[stripe webhook] Failed to initialize Stripe:", e)
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }
  }

  if (!webhookSecret) {
    console.error("[stripe webhook] No webhook secret configured")
    return NextResponse.json(
      { error: "Missing Stripe Webhook Secret. Set STRIPE_WEBHOOK_SECRET in .env or go to Settings → Integrations." },
      { status: 500 }
    )
  }

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error("[stripe webhook] Signature verification failed:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const { id, amount, currency, description, metadata, latest_charge } = paymentIntent

    const existingTx = await prisma.transaction.findUnique({
      where: { stripePaymentIntentId: id }
    })
    if (existingTx) {
      return NextResponse.json({ received: true, message: "Transaction already exists" })
    }

    const orgId = queryOrgId || metadata?.organizationId
    if (!orgId) {
      console.error("[stripe webhook] Missing organizationId in payment_intent metadata. Event ignored.")
      return NextResponse.json({ received: true, warning: "Missing organizationId in metadata or query" })
    }

    let stripeFee = 0
    let fxFee = 0
    let reconciliationDiff = 0
    let stripeNet = amount / 100
    let stripeChargeId: string | undefined
    let chargeCurrency: string = currency

    if (latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(latest_charge as string)
        stripeChargeId = charge.id
        chargeCurrency = charge.currency ?? currency
        if (charge.balance_transaction) {
          const balanceTx = await stripe.balanceTransactions.retrieve(charge.balance_transaction as string, {
            expand: ["fee_details"]
          })
          const totalFee = balanceTx.fee / 100
          stripeNet = balanceTx.net / 100

          console.log(`[stripe webhook] balanceTx debug for ${id}:`, {
            balanceTxId: balanceTx.id,
            balanceTxType: balanceTx.type,
            balanceTxStatus: balanceTx.status,
            balanceTxCurrency: balanceTx.currency,
            chargeCurrency,
            paymentIntentCurrency: currency,
            balanceTxAmount: balanceTx.amount,
            balanceTxFee: balanceTx.fee,
            balanceTxNet: balanceTx.net,
            paymentIntentAmount: amount,
            feeDetails: balanceTx.fee_details?.map(f => ({ type: f.type, amount: f.amount, currency: f.currency })) ?? [],
          })

          const isForeignCurrency = chargeCurrency.toLowerCase() !== (balanceTx.currency ?? "usd").toLowerCase()

          if (isForeignCurrency) {
            // Balance transaction amounts are in settlement currency (e.g. EUR) but payment_intent.amount
            // is in the charge currency (e.g. USD). Convert proportionally using the implicit rate
            // that Stripe has already applied: rate = paymentIntentAmount / balanceTxAmount.
            // This expresses stripeNet in USD without needing an external rate feed.
            // stripeFee is computed as the remainder so the JE always balances to the cent.
            const netFraction = balanceTx.net / balanceTx.amount
            stripeNet = Math.round(netFraction * amount) / 100
            stripeFee = Math.round((amount / 100 - stripeNet) * 100) / 100
            fxFee = 0
          } else {
            stripeFee = totalFee
            const amountRounded = Math.round((amount / 100) * 100) / 100
            const accountedFor = Math.round((stripeNet + stripeFee) * 100) / 100
            reconciliationDiff = Math.round((amountRounded - accountedFor) * 100) / 100
            if (reconciliationDiff > 0.01) {
              console.warn(
                `[stripe webhook] domestic balance transaction gap $${reconciliationDiff} on ${id} — balanceTx.amount(${balanceTx.amount}) != payment_intent.amount(${amount}). Gap posted to Stripe Reconciliation Difference.`
              )
            }
          }
        }
      } catch (e) {
        console.error("[stripe webhook] Failed to fetch charge details:", e)
      }
    }

    const amountInDollars = amount / 100
    const customer_email = metadata?.customer_email || (event.data.object as any).customer_email
    const invoiceIdParam = metadata?.invoiceId

    const matchedInvoice = invoiceIdParam
      ? await prisma.invoice.findUnique({ where: { id: invoiceIdParam } })
      : await prisma.invoice.findFirst({
          where: {
            organizationId: orgId,
            clientEmail: customer_email,
            total: amountInDollars,
            status: { in: ["SENT", "PARTIAL"] }
          }
        })

    if (matchedInvoice) {
      await prisma.payment.create({
        data: {
          invoiceId: matchedInvoice.id,
          amount: amountInDollars,
          method: "stripe",
          paymentDate: new Date(paymentIntent.created * 1000),
          referenceNumber: id,
          organizationId: orgId,
        }
      })
      await recalculateInvoiceStatus(matchedInvoice.id)
    }

    const transaction = await prisma.transaction.create({
      data: {
        stripePaymentIntentId: id,
        amount: amountInDollars,
        currency,
        description: description || metadata?.product_description || "Stripe payment",
        customerEmail: customer_email,
        organizationId: orgId,
        workflowStatus: "running",
        agentLogs: [],
        stripeChargeId,
        stripeFee,
        fxFee,
        stripeNet,
        clearingStatus: "pending",
        invoiceId: matchedInvoice?.id ?? null
      },
    })

    const paymentDate = new Date(paymentIntent.created * 1000)
    const accounts = await resolveStripeAccounts(orgId)
    const jeLines: Array<{ accountName: string; accountType: string; debit: number; credit: number; description?: string }> = []

    jeLines.push({
      accountName: accounts.stripeClearing,
      accountType: "Assets",
      debit: stripeNet,
      credit: 0,
      description: `Stripe clearing – ${id}`,
    })

    if (stripeFee > 0) {
      jeLines.push({
        accountName: accounts.bankFees,
        accountType: "Expenses",
        debit: stripeFee,
        credit: 0,
        description: `Stripe processing fee – ${id}`,
      })
    }

    if (fxFee > 0) {
      jeLines.push({
        accountName: "Foreign Exchange Expense",
        accountType: "Expenses",
        debit: fxFee,
        credit: 0,
        description: `Stripe FX fee – ${id}`,
      })
    }

    if (reconciliationDiff > 0.01) {
      jeLines.push({
        accountName: "Stripe Reconciliation Difference",
        accountType: "Expenses",
        debit: reconciliationDiff,
        credit: 0,
        description: `Balance tx gap – ${id} (investigate: balanceTx.amount != payment_intent.amount)`,
      })
    }

    if (matchedInvoice) {
      jeLines.push({
        accountName: accounts.accountsReceivable,
        accountType: "Assets",
        debit: 0,
        credit: amountInDollars,
        description: `AR cleared – ${matchedInvoice.invoiceNumber}`,
      })
    } else {
      jeLines.push({
        accountName: "Undeposited Funds",
        accountType: "Liabilities",
        debit: 0,
        credit: amountInDollars,
        description: `Unmatched Stripe payment – ${customer_email ?? id} – pending invoice match`,
      })
    }

    after(
      Promise.all([
        createSystemJournalEntry({
          organizationId: orgId,
          sourceType: "StripePayment",
          sourceId: id,
          reference: `PAY-${id.slice(-8)}`,
          description: `Stripe payment – ${customer_email ?? id}`,
          entryDate: paymentDate,
          lines: jeLines,
        }),
        startAgentWorkflow(transaction.id),
      ]).catch(console.error)
    )
  }

  else if (event.type === "payout.paid") {
    const payout = event.data.object as Stripe.Payout

    try {
      const balanceTransactions = await stripe.balanceTransactions.list({ payout: payout.id, limit: 100 })
      const chargeIds = balanceTransactions.data
        .filter((bt) => bt.type === "charge")
        .map((bt) => bt.source as string)
        .filter(Boolean)

      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { payoutId: payout.id },
            { stripeChargeId: { in: chargeIds } }
          ]
        }
      })

      const payoutDate = new Date(payout.arrival_date * 1000)

      for (const tx of transactions) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            clearingStatus: "paid_out",
            payoutDate,
            payoutId: payout.id
          }
        })

        const net = tx.stripeNet ?? tx.amount
        after(
          createSystemJournalEntry({
            organizationId: tx.organizationId,
            sourceType: "StripePayout",
            sourceId: `${payout.id}-${tx.id}`,
            reference: `PAYOUT-${payout.id.slice(-8)}`,
            description: `Stripe payout to bank – ${payout.id}`,
            entryDate: payoutDate,
            lines: [
              {
                accountName: "Cash",
                accountType: "Assets",
                debit: net,
                credit: 0,
                description: `Stripe payout deposited – ${payout.id}`,
              },
              {
                accountName: "Stripe Clearing Account",
                accountType: "Assets",
                debit: 0,
                credit: net,
                description: `Stripe clearing settled – ${payout.id}`,
              },
            ],
          }).catch(console.error)
        )
      }
    } catch (e) {
      console.error("[stripe webhook] Error processing payout.paid:", e)
    }
  }

  else if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge
    try {
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null

      let transaction = await prisma.transaction.findFirst({
        where: { stripeChargeId: charge.id }
      })
      if (!transaction && paymentIntentId) {
        transaction = await prisma.transaction.findFirst({
          where: { stripePaymentIntentId: paymentIntentId }
        })
      }

      if (!transaction) {
        console.warn("[stripe webhook] charge.refunded: no matching transaction for charge", charge.id, "/ pi", paymentIntentId)
      } else {
        const existingJE = await prisma.journalEntry.findUnique({
          where: { organizationId_sourceType_sourceId: { organizationId: transaction.organizationId, sourceType: "Refund", sourceId: charge.id } }
        })

        if (!existingJE) {
          const refundAmount = (charge.amount_refunded || charge.amount) / 100
          const refundDate = new Date()

          let invoiceNumber = "—"
          let invoiceId: string | null = transaction.invoiceId ?? null

          if (invoiceId) {
            const invoice = await prisma.invoice.findUnique({
              where: { id: invoiceId },
              select: { id: true, invoiceNumber: true, total: true, clientName: true }
            })
            if (invoice) {
              invoiceNumber = invoice.invoiceNumber
              const existingCN = await prisma.creditNote.findFirst({ where: { transactionId: transaction.id } })
              if (!existingCN) {
                await prisma.creditNote.create({
                  data: {
                    invoiceId: invoice.id,
                    amount: refundAmount,
                    reason: "Refunded via Stripe",
                    reasonCategory: "other",
                    refundType: "stripe_refund",
                    transactionId: transaction.id,
                    organizationId: transaction.organizationId,
                    refundMethod: "stripe",
                  }
                })
              }
            }
          }

          after(
            createSystemJournalEntry({
              organizationId: transaction.organizationId,
              sourceType: "Refund",
              sourceId: charge.id,
              reference: `REF-${charge.id.slice(-8)}`,
              description: invoiceId
                ? `Stripe refund – ${invoiceNumber} ($${refundAmount.toFixed(2)})`
                : `Stripe refund – ${charge.id} ($${refundAmount.toFixed(2)})`,
              entryDate: refundDate,
              lines: [
                {
                  accountName: "Service Revenue",
                  accountType: "Revenue",
                  debit: refundAmount,
                  credit: 0,
                  description: invoiceId ? `Revenue reversed – ${invoiceNumber}` : `Revenue reversed – Stripe refund ${charge.id}`,
                },
                {
                  accountName: "Stripe Clearing Account",
                  accountType: "Assets",
                  debit: 0,
                  credit: refundAmount,
                  description: `Stripe refund settlement – ${charge.id}`,
                },
              ],
            }).catch(console.error)
          )
        }
      }
    } catch (e) {
      console.error("[stripe webhook] Error processing charge.refunded:", e)
    }
  }

  return NextResponse.json({ received: true })
}
