import { prisma } from "@/lib/prisma"
import axios from "axios"

export async function createNotification(data: {
  organizationId: string
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR"
  title: string
  message: string
  link?: string
}) {
  return await prisma.notification.create({
    data: {
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      organizationId: data.organizationId,
    }
  })
}

export async function sendVoiceSummary(transactionId: string) {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      organization: {
        include: { financialSettings: true }
      }
    }
  })
  if (!tx || !tx.organization.financialSettings?.enableVoiceSummary) return

  const settings = tx.organization.financialSettings
  const amount = tx.amount
  const runwayDays = Math.round((tx.runwayMonths || 0) * 30)
  const zeroCashDate = tx.zeroCashDate?.toLocaleDateString() || "unknown"
  const percentAhead = tx.percentAhead || 0

  const script = settings.voiceScriptTemplate
    .replace("{{amount}}", `$${amount}`)
    .replace("{{runwayDays}}", `${runwayDays}`)
    .replace("{{zeroCashDate}}", zeroCashDate)
    .replace("{{percentAhead}}", `${percentAhead.toFixed(0)}`)

  const apiKey = settings.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY
  const voiceId = settings.elevenLabsVoiceId || "21m00Tcm4TlvDq8ikWAM"

  if (!apiKey) {
    console.warn("[voice] No ElevenLabs API key configured — skipping voice summary")
    return
  }

  try {
    await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: script,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.5 },
      },
      {
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        responseType: "arraybuffer",
      }
    )
    console.log("[voice] ElevenLabs voice summary generated")
  } catch (error) {
    console.error("[voice] ElevenLabs error:", error)
  }
}

export async function sendSMSNotification(transactionId: string) {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      organization: {
        include: { financialSettings: true }
      }
    }
  })
  if (!tx || !tx.organization.financialSettings?.enableSMS) return

  const settings = tx.organization.financialSettings
  const { twilioAccountSid, twilioAuthToken, twilioFromNumber, smsRecipientNumber } = settings

  if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber || !smsRecipientNumber) {
    console.warn("[sms] Twilio credentials incomplete — skipping SMS notification")
    return
  }

  const body = `Ryzha: $${tx.amount} transaction processed. Runway: ${Math.round((tx.runwayMonths || 0) * 30)} days.`

  try {
    await sendTwilioSMS({ accountSid: twilioAccountSid, authToken: twilioAuthToken, from: twilioFromNumber, to: smsRecipientNumber, body })
    console.log("[sms] SMS sent to", smsRecipientNumber)
  } catch (error) {
    console.error("[sms] Twilio error:", error)
  }
}

export async function sendTwilioSMS({
  accountSid,
  authToken,
  from,
  to,
  body,
}: {
  accountSid: string
  authToken: string
  from: string
  to: string
  body: string
}) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const params = new URLSearchParams({ From: from, To: to, Body: body })

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`[sms] Twilio API error ${response.status}: ${err}`)
  }

  return response.json()
}
