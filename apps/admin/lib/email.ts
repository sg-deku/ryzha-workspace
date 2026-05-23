async function sendBrevoEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html?: string
  text?: string
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
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      ...(html ? { htmlContent: html } : { textContent: text }),
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
  text,
}: {
  to: string
  subject: string
  html?: string
  text?: string
}) {
  try {
    await sendBrevoEmail({ to, subject, html, text })
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
<body style="margin:0;padding:0;background-color:#eff6ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#2563eb;border-radius:12px 12px 0 0;padding:24px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="https://ryzha.vercel.app/logo.png" alt="Ryzha" width="40" height="40"
                         style="display:inline-block;vertical-align:middle;filter:brightness(0) invert(1);" />
                    <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;vertical-align:middle;margin-left:10px;">Ryzha</span>
                    <span style="font-size:11px;color:#bfdbfe;margin-left:8px;font-weight:400;letter-spacing:0.5px;vertical-align:middle;">Financial Intelligence</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 36px 28px;border-left:1px solid #bfdbfe;border-right:1px solid #bfdbfe;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#eff6ff;border:1px solid #bfdbfe;border-top:none;border-radius:0 0 12px 12px;padding:24px 36px;">
              <p style="margin:0 0 4px;font-size:14px;color:#1e40af;font-weight:600;">Thank you,</p>
              <p style="margin:0 0 16px;font-size:14px;color:#1e40af;">Karina &amp; Sushmit</p>
              <p style="margin:0;font-size:12px;color:#93c5fd;line-height:1.6;">
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
