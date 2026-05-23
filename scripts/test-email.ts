import { readFileSync } from "fs"
import { resolve } from "path"

function loadEnv(envPath: string): Record<string, string> {
  const env: Record<string, string> = {}
  try {
    const content = readFileSync(envPath, "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      env[key] = val
    }
  } catch {
  }
  return env
}

async function main() {
  const env = loadEnv(resolve(import.meta.dirname, "../.env"))
  const apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY
  const fromEmail = env.SMTP_FROM || process.env.SMTP_FROM
  const toEmail = process.argv[2] || "sushmit.ghosh@icloud.com"

  if (!apiKey) {
    console.error("❌ BREVO_API_KEY is not set in .env")
    process.exit(1)
  }

  if (!fromEmail) {
    console.error("❌ SMTP_FROM is not set in .env")
    process.exit(1)
  }

  console.log(`📧 Sending test email via Brevo REST API...`)
  console.log(`   From: ${fromEmail}`)
  console.log(`   To:   ${toEmail}`)

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Ryzha", email: fromEmail },
      to: [{ email: toEmail }],
      subject: "Test Email from Ryzha (Brevo REST API)",
      htmlContent:
        "<b>This is a test email to verify Brevo REST API configuration.</b>",
    }),
  })

  const body = await response.json()

  if (!response.ok) {
    console.error("❌ Brevo API error:", response.status, body)
    process.exit(1)
  }

  console.log("✅ Email accepted by Brevo! messageId:", body.messageId)
  console.log("   Check your inbox (and spam) at", toEmail)
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err)
  process.exit(1)
})
