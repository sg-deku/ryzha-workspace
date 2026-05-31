import { sendEmail, emailTemplate } from "@/lib/email"

export async function sendPortalInviteEmail({
  to,
  vendorName,
  orgName,
  portalUrl,
  expiryHours,
}: {
  to: string
  vendorName: string
  orgName: string
  portalUrl: string
  expiryHours: number
}) {
  await sendEmail({
    to,
    subject: `${orgName} has invited you to their Vendor Portal`,
    html: emailTemplate(`
      <h1 style="font-size:22px;font-weight:700;color:#09090b;margin:0 0 16px;">Hi ${vendorName},</h1>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 14px;">
        <strong>${orgName}</strong> has invited you to access their Vendor Self-Service Portal via Ryzha.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 24px;">
        Through the portal you can view your purchase orders, track invoice status, see payment history, and update your company profile.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background-color:#2563eb;border-radius:8px;padding:12px 28px;">
            <a href="${portalUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Access Vendor Portal</a>
          </td>
        </tr>
      </table>
      <p style="font-size:13px;color:#6b7280;margin:0;">This link expires in ${expiryHours} hours. If you did not expect this invitation, please ignore this email.</p>
    `),
  })
}

export async function sendRemittanceAdviceEmail({
  to,
  vendorName,
  paymentRef,
  paymentDate,
  invoices,
  totalAmount,
  currency,
}: {
  to: string
  vendorName: string
  paymentRef: string
  paymentDate: string
  invoices: { number: string; amount: number }[]
  totalAmount: number
  currency: string
}) {
  const rows = invoices
    .map(
      (inv) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${inv.number}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">${currency} ${inv.amount.toFixed(2)}</td>
      </tr>
    `
    )
    .join("")

  await sendEmail({
    to,
    subject: `Payment Remittance Advice — ${paymentRef}`,
    html: emailTemplate(`
      <h1 style="font-size:22px;font-weight:700;color:#09090b;margin:0 0 16px;">Remittance Advice</h1>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 6px;">Dear <strong>${vendorName}</strong>,</p>
      <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 20px;">A payment has been processed for the following invoices:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;margin:0 0 20px;border-collapse:collapse;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;font-size:13px;text-align:left;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Invoice #</th>
            <th style="padding:10px 12px;font-size:13px;text-align:right;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 12px;font-size:14px;font-weight:700;">Total</td>
            <td style="padding:10px 12px;font-size:14px;font-weight:700;text-align:right;">${currency} ${totalAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="font-size:14px;color:#6b7280;margin:0 0 4px;"><strong>Payment Reference:</strong> ${paymentRef}</p>
      <p style="font-size:14px;color:#6b7280;margin:0;"><strong>Payment Date:</strong> ${paymentDate}</p>
    `),
  })
}
