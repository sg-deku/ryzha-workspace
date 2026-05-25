import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendTwilioSMS } from "@/lib/notifications"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId: session.user.organizationId },
  })

  if (!settings?.twilioAccountSid || !settings?.twilioAuthToken || !settings?.twilioFromNumber) {
    return NextResponse.json({ error: "Twilio is not configured. Add your credentials first." }, { status: 400 })
  }

  if (!settings?.smsRecipientNumber) {
    return NextResponse.json({ error: "No recipient number configured." }, { status: 400 })
  }

  try {
    await sendTwilioSMS({
      accountSid: settings.twilioAccountSid,
      authToken: settings.twilioAuthToken,
      from: settings.twilioFromNumber,
      to: settings.smsRecipientNumber,
      body: "Ryzha test message: your Twilio SMS connector is working correctly.",
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[test-sms]", err)
    return NextResponse.json({ error: err.message || "Failed to send test SMS" }, { status: 500 })
  }
}
