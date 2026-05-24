import { NextRequest, NextResponse } from "next/server"
import { sendEmail, emailTemplate } from "@/lib/email"

const FOUNDER_EMAILS = ["sushmit.ghosh@icloud.com", "karyrocha3979@hotmail.com"]

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, message } = await req.json()

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 })
    }

    const subject = `New Contact Form Message from ${firstName} ${lastName}`

    const html = emailTemplate(`
      <h2 style="font-size:20px;font-weight:700;color:#09090b;margin:0 0 20px;">New Contact Form Submission</h2>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 14px;background-color:#f8fafc;border:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#64748b;width:120px;white-space:nowrap;">Name</td>
          <td style="padding:10px 14px;border:1px solid #e2e8f0;font-size:14px;color:#0f172a;">${firstName} ${lastName}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background-color:#f8fafc;border:1px solid #e2e8f0;border-top:none;font-size:13px;font-weight:600;color:#64748b;">Email</td>
          <td style="padding:10px 14px;border:1px solid #e2e8f0;border-top:none;font-size:14px;color:#0f172a;">
            <a href="mailto:${email}" style="color:#2563eb;text-decoration:none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background-color:#f8fafc;border:1px solid #e2e8f0;border-top:none;font-size:13px;font-weight:600;color:#64748b;vertical-align:top;">Message</td>
          <td style="padding:10px 14px;border:1px solid #e2e8f0;border-top:none;font-size:14px;color:#0f172a;white-space:pre-wrap;">${message}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background-color:#f8fafc;border:1px solid #e2e8f0;border-top:none;font-size:13px;font-weight:600;color:#64748b;">Received</td>
          <td style="padding:10px 14px;border:1px solid #e2e8f0;border-top:none;font-size:14px;color:#64748b;">${new Date().toUTCString()}</td>
        </tr>
      </table>

      <p style="font-size:13px;color:#94a3b8;margin:0;">
        Reply directly to <a href="mailto:${email}" style="color:#2563eb;text-decoration:none;">${email}</a> to respond to this message.
      </p>
    `)

    await Promise.all(
      FOUNDER_EMAILS.map((to) => sendEmail({ to, subject, html }))
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 })
  }
}
