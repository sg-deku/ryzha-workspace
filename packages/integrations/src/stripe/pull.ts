import { createStripeClient } from "./client"
import { normaliseStripeEvent } from "./normalise"
import type { NormalisedFinancialEvent } from "../types"

export async function pullStripeHistorical(
  secretKey: string,
  options: { daysSince?: number; limit?: number } = {}
): Promise<NormalisedFinancialEvent[]> {
  const stripe = createStripeClient(secretKey)
  const { daysSince = 90, limit = 200 } = options

  const since = Math.floor(Date.now() / 1000) - daysSince * 86400
  const results: NormalisedFinancialEvent[] = []

  const charges = await stripe.charges.list({
    created: { gte: since },
    limit,
  })

  for (const charge of charges.data) {
    if (charge.paid && charge.status === "succeeded" && charge.payment_intent) {
      const pi = charge.payment_intent as any
      const normalised = normaliseStripeEvent("payment_intent.succeeded", {
        id: typeof pi === "string" ? pi : pi.id,
        amount: charge.amount,
        currency: charge.currency,
        customer: charge.customer,
        receipt_email: charge.receipt_email,
        description: charge.description,
        payment_method_types: [charge.payment_method_details?.type],
        metadata: charge.metadata,
      })
      if (normalised) results.push(normalised)
    }
  }

  const invoices = await stripe.invoices.list({
    created: { gte: since },
    status: "paid",
    limit,
  })

  for (const invoice of invoices.data) {
    const normalised = normaliseStripeEvent("invoice.paid", invoice)
    if (normalised) results.push(normalised)
  }

  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    limit,
  })

  for (const sub of subscriptions.data) {
    const normalised = normaliseStripeEvent("customer.subscription.created", sub)
    if (normalised) results.push(normalised)
  }

  return results
}

export { normaliseStripeEvent }
