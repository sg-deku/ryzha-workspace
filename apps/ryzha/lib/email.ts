import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  if (!from || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn("[email] SMTP not fully configured — skipping email send")
    return
  }

  await transporter.sendMail({ from, to, subject, html })
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
