import { prisma } from "./prisma"
import crypto from "crypto"

export async function triggerWebhook(event: string, organizationId: string, payload: any) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      organizationId,
      events: { has: event }
    }
  })

  for (const webhook of webhooks) {
    deliverWebhook(webhook, event, payload)
  }
}

async function deliverWebhook(webhook: any, event: string, payload: any, retryCount = 0) {
  const timestamp = Date.now()
  const body = JSON.stringify({
    id: crypto.randomUUID(),
    event,
    timestamp,
    payload
  })

  // Create signature
  const signature = crypto
    .createHmac("sha256", webhook.secret)
    .update(body)
    .digest("hex")

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ryzha-Signature": signature,
        "X-Ryzha-Event": event
      },
      body
    })

    const responseText = await response.text()

    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: payload as any,
        statusCode: response.status,
        responseBody: responseText.slice(0, 1000), // Limit size
        success: response.ok,
        retryCount
      }
    })

    if (response.ok) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastSent: new Date(), failures: 0 }
      })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error: any) {
    console.error(`Webhook delivery failed for ${webhook.url}:`, error)

    if (retryCount < 3) {
      // Exponential backoff: 5s, 25s, 125s
      const delay = Math.pow(5, retryCount + 1) * 1000
      setTimeout(() => {
        deliverWebhook(webhook, event, payload, retryCount + 1)
      }, delay)
    } else {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { failures: { increment: 1 } }
      })
      
      // Log final failure
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as any,
          success: false,
          responseBody: error.message,
          retryCount
        }
      })
    }
  }
}
