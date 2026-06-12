import type { ConnectorDef } from "../types"

export const emailConnector: ConnectorDef = {
  slug: "email",
  name: "Email",
  description: "Send emails via SMTP or SendGrid.",
  category: "communication",
  color: "#0ea5e9",
  authType: "apikey",
  sortOrder: 21,
  triggers: [],
  actions: [
    {
      slug: "send_email",
      name: "Send Email",
      description: "Send an email to one or more recipients.",
      inputSchema: [
        { key: "to", label: "To", type: "text", required: true, supportsDataPills: true, placeholder: "finance@company.com or {{trigger.customerEmail}}" },
        { key: "cc", label: "CC (optional)", type: "text", supportsDataPills: true },
        { key: "subject", label: "Subject", type: "text", required: true, supportsDataPills: true },
        { key: "body", label: "Body (HTML or plain text)", type: "textarea", required: true, supportsDataPills: true },
      ],
      outputSchema: { messageId: "string", accepted: "string[]" },
      sampleOutput: { messageId: "<abc@smtp.example.com>", accepted: ["finance@company.com"] },
      sortOrder: 0,
    },
  ],
}
