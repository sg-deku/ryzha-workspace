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

export async function sendSignupThankYouEmail(to: string, name: string) {
  await sendEmail({
    to,
    subject: "Thanks for signing up to Ryzha — you're on the list!",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111;">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Hi ${name},</h1>
        <p style="font-size:16px;line-height:1.6;margin-bottom:16px;">
          Thanks for signing up to <strong>Ryzha</strong>! We've received your organisation details and they are now under review by our founders.
        </p>
        <p style="font-size:16px;line-height:1.6;margin-bottom:16px;">
          You'll get another email as soon as your account is approved and you can start using the platform.
        </p>
        <p style="font-size:16px;line-height:1.6;margin-bottom:32px;">
          If you have any questions in the meantime, just reply to this email.
        </p>
        <p style="font-size:14px;color:#666;">— The Ryzha Team</p>
      </div>
    `,
  })
}
