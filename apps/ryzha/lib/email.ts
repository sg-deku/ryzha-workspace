async function sendBrevoEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const apiKey = process.env.BREVO_API_KEY
  const fromEmail = process.env.SMTP_FROM
  const fromName = process.env.SMTP_FROM_NAME || "Ryzha"

  if (!apiKey || !fromEmail) {
    console.warn("[email] BREVO_API_KEY or SMTP_FROM not set — skipping email send")
    return
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`[email] Brevo API error ${response.status}: ${errorBody}`)
  }

  const result = await response.json()
  console.log("[email] Sent successfully, messageId:", result.messageId)
  return result
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    await sendBrevoEmail({ to, subject, html })
  } catch (err) {
    console.error("[email] Failed to send email:", err)
  }
}

export function emailTemplate(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ryzha</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Lylal,sans-serif;">
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

export async function sendSignupThankYouEmail(to: string, name: string) {
  await sendEmail({
    to,
    subject: "Thanks for signing up to Ryzha — you're on the list!",
    html: emailTemplate(`
      <h1 style="font-size:22px;font-weight:700;color:#09090b;margin:0 0 16px;">Hi ${name},</h1>
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
  })
}
