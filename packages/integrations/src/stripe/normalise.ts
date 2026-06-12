import type { NormalisedFinancialEvent } from "../types"

export function normaliseStripeEvent(
  eventType: string,
  obj: any
): NormalisedFinancialEvent | null {
  switch (eventType) {
    case "payment_intent.succeeded":
      return {
        source: "stripe",
        externalId: obj.id,
        eventType: "PAYMENT_RECEIVED",
        amount: obj.amount / 100,
        currency: (obj.currency ?? "usd").toUpperCase(),
        rawPayload: obj,
        normalisedData: {
          customerId: obj.customer ?? null,
          customerEmail: obj.receipt_email ?? obj.metadata?.email ?? null,
          description: obj.description ?? null,
          paymentMethod: obj.payment_method_types?.[0] ?? null,
          metadata: obj.metadata ?? {},
        },
      }

    case "invoice.paid":
      return {
        source: "stripe",
        externalId: obj.id,
        eventType: "INVOICE_PAID",
        amount: obj.amount_paid / 100,
        currency: (obj.currency ?? "usd").toUpperCase(),
        rawPayload: obj,
        normalisedData: {
          customerId: obj.customer ?? null,
          customerEmail: obj.customer_email ?? null,
          subscriptionId: obj.subscription ?? null,
          invoiceNumber: obj.number ?? null,
          periodStart: obj.period_start ? new Date(obj.period_start * 1000).toISOString() : undefined,
          periodEnd: obj.period_end ? new Date(obj.period_end * 1000).toISOString() : undefined,
          lineItems: obj.lines?.data?.map((l: any) => ({
            description: l.description,
            amount: l.amount / 100,
            priceId: l.price?.id ?? null,
            planInterval: l.price?.recurring?.interval ?? null,
          })) ?? [],
        },
      }

    case "customer.subscription.created":
      return {
        source: "stripe",
        externalId: obj.id,
        eventType: "SUBSCRIPTION_CREATED",
        amount: obj.plan?.amount ? obj.plan.amount / 100 : undefined,
        currency: (obj.currency ?? "usd").toUpperCase(),
        rawPayload: obj,
        normalisedData: {
          customerId: obj.customer ?? null,
          planId: obj.plan?.id ?? null,
          planInterval: obj.plan?.interval ?? null,
          status: obj.status,
          trialEnd: obj.trial_end ? new Date(obj.trial_end * 1000).toISOString() : undefined,
          currentPeriodStart: new Date(obj.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(obj.current_period_end * 1000).toISOString(),
        },
      }

    case "customer.subscription.updated":
      return {
        source: "stripe",
        externalId: `${obj.id}_${obj.created}`,
        eventType: "SUBSCRIPTION_UPDATED",
        amount: obj.plan?.amount ? obj.plan.amount / 100 : undefined,
        currency: (obj.currency ?? "usd").toUpperCase(),
        rawPayload: obj,
        normalisedData: {
          customerId: obj.customer ?? null,
          planId: obj.plan?.id ?? null,
          status: obj.status,
          previousAttributes: obj.previous_attributes ?? {},
        },
      }

    case "customer.subscription.deleted":
      return {
        source: "stripe",
        externalId: `${obj.id}_cancelled`,
        eventType: "SUBSCRIPTION_CANCELLED",
        amount: obj.plan?.amount ? obj.plan.amount / 100 : undefined,
        currency: (obj.currency ?? "usd").toUpperCase(),
        rawPayload: obj,
        normalisedData: {
          customerId: obj.customer ?? null,
          planId: obj.plan?.id ?? null,
          cancelledAt: obj.canceled_at ? new Date(obj.canceled_at * 1000).toISOString() : undefined,
          endedAt: obj.ended_at ? new Date(obj.ended_at * 1000).toISOString() : undefined,
        },
      }

    case "charge.refunded":
      return {
        source: "stripe",
        externalId: `refund_${obj.id}`,
        eventType: "REFUND_ISSUED",
        amount: obj.amount_refunded / 100,
        currency: (obj.currency ?? "usd").toUpperCase(),
        rawPayload: obj,
        normalisedData: {
          chargeId: obj.id,
          paymentIntentId: obj.payment_intent ?? null,
          refundReason: obj.refunds?.data?.[0]?.reason ?? null,
        },
      }

    default:
      return null
  }
}
