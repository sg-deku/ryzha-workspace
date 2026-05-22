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

  let script = settings.voiceScriptTemplate
    .replace("{{amount}}", `$${amount}`)
    .replace("{{runwayDays}}", `${runwayDays}`)
    .replace("{{zeroCashDate}}", zeroCashDate)
    .replace("{{percentAhead}}", `${percentAhead.toFixed(0)}`)

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
  const VOICE_ID = settings.elevenLabsVoiceId || "21m00Tcm4TlvDq8ikWAM"

  if (!ELEVENLABS_API_KEY) {
    console.warn("ELEVENLABS_API_KEY not set, skipping voice summary")
    return
  }

  try {
    await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        text: script,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      },
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    )
    // In a real app, you'd save this buffer to S3 and notify the UI via SSE
    console.log("ElevenLabs voice summary generated")
  } catch (error) {
    console.error("ElevenLabs error:", error)
  }
}

export async function sendSMSNotification(transactionId: string) {
  // Mock SMS notification
  console.log(`SMS Notification sent for transaction ${transactionId}`)
}
