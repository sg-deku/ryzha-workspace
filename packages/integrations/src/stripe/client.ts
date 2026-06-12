import Stripe from "stripe"

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: "2025-01-27.acacia" as any,
    typescript: true,
  })
}
