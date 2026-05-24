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
  } catch {}
  return env
}

function emailTemplate(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ryzha</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#2563eb;border-radius:12px 12px 0 0;padding:24px 36px;">
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1;">Ryzha</div>
              <div style="font-size:11px;color:#bfdbfe;font-weight:400;letter-spacing:0.5px;margin-top:4px;">Financial Intelligence</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 36px 28px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f3f4f6;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px 36px;">
              <p style="margin:0 0 4px;font-size:14px;color:#374151;font-weight:600;">Thank you,</p>
              <p style="margin:0 0 2px;font-size:14px;color:#374151;">Karina &amp; Sushmit</p>
              <p style="margin:0 0 16px;font-size:12px;color:#6b7280;font-style:italic;">Founders, Ryzha</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                You received this email because you have an account with Ryzha.<br />
                &copy; ${new Date().getFullYear()} Ryzha. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const emails = [
  {
    label: "Signup thank-you",
    subject: "Thanks for signing up to Ryzha — you're on the list!",
    html: emailTemplate(`
      <h1 style="font-size:22px;font-weight:700;color:#09090b;margin:0 0 16px;">Hi Sushmit,</h1>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 14px;">
        Thanks for signing up to <strong>Ryzha</strong>! We've received your organisation details and they are now under review by our founders.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 14px;">
        You'll get another email as soon as your account is approved — then you can log in, invite your team, and start using the platform.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0;">
        In the meantime, if you have any questions just reply to this email and we'll get back to you.
      </p>
    `),
  },
  {
    label: "Organisation approved",
    subject: "🎉 Acme Corp is approved — welcome to Ryzha!",
    html: emailTemplate(`
      <h1 style="font-size:22px;font-weight:700;color:#09090b;margin:0 0 16px;">Welcome to Ryzha, Sushmit!</h1>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 14px;">
        Great news — your organisation <strong>Acme Corp</strong> has been approved and your account is now active.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 20px;">
        You can now log in, invite your team members, and start using Ryzha's financial intelligence platform.
      </p>
      <a href="https://ryzha.vercel.app/login" style="display:inline-block;background:#2563eb;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Log In to Ryzha
      </a>
      <p style="font-size:13px;color:#a1a1aa;margin:24px 0 0;">
        If you have any questions, simply reply to this email — we're here to help.
      </p>
    `),
  },
  {
    label: "Team invitation",
    subject: "You've been invited to join Acme Corp on Ryzha",
    html: emailTemplate(`
      <h1 style="font-size:22px;font-weight:700;color:#09090b;margin:0 0 16px;">You're invited!</h1>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 14px;">
        Hi Sushmit,
      </p>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 20px;">
        You've been invited to join <strong>Acme Corp</strong> on Ryzha — the financial intelligence platform built for modern teams.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 24px;">
        Click below to accept your invitation and set up your account:
      </p>
      <a href="https://ryzha.vercel.app/login" style="display:inline-block;background:#2563eb;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Accept Invitation
      </a>
      <p style="font-size:13px;color:#a1a1aa;margin:24px 0 0;">
        If you weren't expecting this invitation, you can safely ignore this email.
      </p>
    `),
  },
]

async function sendEmail(
  apiKey: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  html: string
) {
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
      subject,
      htmlContent: html,
    }),
  })

  const body = await response.json()
  if (!response.ok) throw new Error(`Brevo ${response.status}: ${JSON.stringify(body)}`)
  return body.messageId
}

async function main() {
  const env = loadEnv(resolve(import.meta.dirname, "../.env"))
  const apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY
  const fromEmail = env.SMTP_FROM || process.env.SMTP_FROM
  const toEmail = "sushmit.ghosh@icloud.com"

  if (!apiKey) { console.error("❌ BREVO_API_KEY not set"); process.exit(1) }
  if (!fromEmail) { console.error("❌ SMTP_FROM not set"); process.exit(1) }

  console.log(`\n📧 Sending ${emails.length} branded test emails to ${toEmail}\n`)

  for (const email of emails) {
    process.stdout.write(`  Sending "${email.label}"... `)
    try {
      const msgId = await sendEmail(apiKey, fromEmail, toEmail, email.subject, email.html)
      console.log(`✅  messageId: ${msgId}`)
    } catch (err: any) {
      console.log(`❌  ${err.message}`)
    }
  }

  console.log("\nDone. Check your inbox at", toEmail)
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err)
  process.exit(1)
})
