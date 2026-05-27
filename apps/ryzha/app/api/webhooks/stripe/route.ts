import { NextResponse, after } from "next/server"
import Stripe from "stripe"
import { getStripe, getStripeForOrg } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { startAgentWorkflow } from "@/lib/agents/orchestrator"
import { syncGLForOrganization } from "@/lib/reports/general-ledger/sync"
import { recalculateInvoiceStatus } from "@/lib/agents/o2c/cash-application"

export const dynamic = "force-dynamic"

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
    
    if (settings?.stripeWebhookSecret) {
      webhookSecret = settings.stripeWebhookSecret
    }
    
    if (settings?.stripeSecretKey) {
      stripe = new Stripe(settings.stripeSecretKey, {
        apiVersion: "2025-01-27.acacia" as any,
        typescript: true,
      })
    }
  }

  // Fallback to environment variable if no org-specific key was found
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

  const stripeOrgId = queryOrgId // It may be from URL

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const { id, amount, currency, description, metadata, latest_charge } = paymentIntent

    // Check early if transaction already exists to avoid duplicate payments/processing
    const existingTx = await prisma.transaction.findUnique({
      where: { stripePaymentIntentId: id }
    })
    
    if (existingTx) {
      console.log(`[stripe webhook] Transaction for PaymentIntent ${id} already exists. Ignoring to prevent duplicates.`)
      return NextResponse.json({ received: true, message: "Transaction already exists" })
    }

    const orgId = stripeOrgId || metadata?.organizationId
    if (!orgId) {
      console.error("[stripe webhook] Missing organizationId in payment_intent metadata. Event ignored.")
      return NextResponse.json({ received: true, warning: "Missing organizationId in metadata or query" })
    }

    let stripeFee = 0
    let fxFee = 0
    let stripeNet = amount / 100
    let stripeChargeId = undefined

    if (latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(latest_charge as string)
        stripeChargeId = charge.id
        if (charge.balance_transaction) {
          const balanceTx = await stripe.balanceTransactions.retrieve(charge.balance_transaction as string, {
            expand: ['fee_details']
          })
          
          stripeFee = balanceTx.fee / 100
          
          if (balanceTx.fee_details) {
            fxFee = balanceTx.fee_details
              .filter(f => f.type === "currency_conversion")
              .reduce((s, f) => s + f.amount, 0) / 100
          }
          
          stripeNet = balanceTx.net / 100
        }
      } catch (e) {
        console.error("[stripe webhook] Failed to fetch charge details:", e)
      }
    }

    const customer_email = metadata?.customer_email || (event.data.object as any).customer_email
    const invoiceIdParam = metadata?.invoiceId

    const matchedInvoice = invoiceIdParam
      ? await prisma.invoice.findUnique({ where: { id: invoiceIdParam } })
      : await prisma.invoice.findFirst({
          where: {
            organizationId: orgId,
            clientEmail: customer_email,
            total: amount / 100,
            status: { in: ["SENT", "PARTIAL"] }
          }
        })

    if (matchedInvoice) {
      await prisma.payment.create({
        data: {
          invoiceId: matchedInvoice.id,
          amount: amount / 100,
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
        amount: amount / 100,
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

    console.log(`[stripe webhook] Transaction ${transaction.id} created for org ${orgId}. Starting agent workflow.`)
    after(startAgentWorkflow(transaction.id).catch(console.error))
  } 
  else if (event.type === "payout.paid") {
    const payout = event.data.object as Stripe.Payout
    
    try {
      const balanceTransactions = await stripe.balanceTransactions.list({ payout: payout.id, limit: 100 })
      
      const chargeIds = balanceTransactions.data
        .filter(bt => bt.type === "charge")
        .map(bt => bt.source as string)
        .filter(Boolean)

      if (chargeIds.length > 0 || payout.id) {
        const transactions = await prisma.transaction.findMany({
          where: {
            OR: [
              { payoutId: payout.id },
              { stripeChargeId: { in: chargeIds } }
            ]
          }
        })
        
        const orgIdsToSync = new Set<string>()

        for (const tx of transactions) {
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { 
              clearingStatus: "paid_out",
              payoutDate: new Date(payout.arrival_date * 1000),
              payoutId: payout.id
            }
          })
          orgIdsToSync.add(tx.organizationId)
        }

        // Trigger GL sync for each affected org
        for (const org of Array.from(orgIdsToSync)) {
          after(syncGLForOrganization(org).catch(console.error))
        }
      }
    } catch (e) {
      console.error("[stripe webhook] Error processing payout.paid:", e)
    }
  }
  else if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { stripeChargeId: charge.id }
      })
      
      if (transaction) {
        // Reverse Stage 2 entries and create CreditNote record if not already present
        // First check if a CreditNote exists for this transaction
        const existingCreditNote = await prisma.creditNote.findFirst({
          where: { transactionId: transaction.id }
        })
        
        if (!existingCreditNote && transaction.invoiceId) {
          // If no credit note exists, create one (this is a direct Stripe refund)
          const invoice = await prisma.invoice.findUnique({
            where: { id: transaction.invoiceId }
          })
          
          if (invoice) {
            await prisma.creditNote.create({
              data: {
                invoiceId: invoice.id,
                amount: (charge.amount_refunded || charge.amount) / 100,
                reason: "Refunded via Stripe",
                reasonCategory: "other",
                transactionId: transaction.id,
                organizationId: transaction.organizationId,
                refundMethod: "stripe"
              }
            })
            
            // Revert invoice status back if needed, or sync GL
            after(syncGLForOrganization(transaction.organizationId).catch(console.error))
          }
        }
      }
    } catch (e) {
      console.error("[stripe webhook] Error processing charge.refunded:", e)
    }
  }

  return NextResponse.json({ received: true })
}
