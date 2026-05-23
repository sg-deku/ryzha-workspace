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
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#09090b;border-radius:12px 12px 0 0;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Ryzha</span>
                    <span style="font-size:12px;color:#a1a1aa;margin-left:8px;font-weight:400;letter-spacing:0.5px;">Financial Intelligence</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 36px 28px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 12px 12px;padding:24px 36px;">
              <p style="margin:0 0 4px;font-size:14px;color:#3f3f46;font-weight:600;">Thank you,</p>
              <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">Karina &amp; Sushmit</p>
              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
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
