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
