import nodemailer from 'nodemailer'

const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "REDACTED_SMTP_KEY"

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'ac3322001@smtp-brevo.com',
    pass: SMTP_PASSWORD,
  },
})

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
  if (!SMTP_PASSWORD) {
    console.warn("SMTP_PASSWORD is not set. Email will not be sent.")
    console.log(`Mock Email to: ${to} | Subject: ${subject}`)
    return
  }
  
  return transporter.sendMail({
    from: '"Ryzha" <noreply@ryzha.com>',
    to,
    subject,
    html,
    text,
  })
}