import type { NormalisedFinancialEvent } from "../types"

export function normaliseStripePaymentIntent(raw: Record<string, unknown>): NormalisedFinancialEvent {
  const obj = raw as any
  return {
    source: "stripe",
    externalId: obj.id,
    eventType: "PAYMENT_RECEIVED",
    amount: obj.amount / 100,
    currency: (obj.currency ?? "usd").toUpperCase(),
    rawPayload: raw,
    normalisedData: {
      customerId: obj.customer,
      customerEmail: obj.receipt_email ?? obj.metadata?.email,
      description: obj.description,
      paymentMethod: obj.payment_method_types?.[0],
      metadata: obj.metadata,
    },
  }
}

export function normaliseStripeInvoicePaid(raw: Record<string, unknown>): NormalisedFinancialEvent {
  const obj = raw as any
  return {
    source: "stripe",
    externalId: obj.id,
    eventType: "INVOICE_PAID",
    amount: obj.amount_paid / 100,
    currency: (obj.currency ?? "usd").toUpperCase(),
    rawPayload: raw,
    normalisedData: {
      customerId: obj.customer,
      customerEmail: obj.customer_email,
      subscriptionId: obj.subscription,
      invoiceNumber: obj.number,
      periodStart: obj.period_start ? new Date(obj.period_start * 1000).toISOString() : null,
      periodEnd: obj.period_end ? new Date(obj.period_end * 1000).toISOString() : null,
      lineItems: obj.lines?.data?.map((l: any) => ({
        description: l.description,
        amount: l.amount / 100,
        priceId: l.price?.id,
      })),
    },
  }
}
