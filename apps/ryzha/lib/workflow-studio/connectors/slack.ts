import type { ConnectorDef } from "../types"

export const slackConnector: ConnectorDef = {
  slug: "slack",
  name: "Slack",
  description: "Send messages, DMs, and notifications to Slack channels.",
  category: "communication",
  color: "#4a154b",
  authType: "apikey",
  sortOrder: 20,
  triggers: [],
  actions: [
    {
      slug: "send_message",
      name: "Send Channel Message",
      description: "Post a message to a Slack channel.",
      inputSchema: [
        { key: "channel", label: "Channel", type: "text", required: true, placeholder: "#finance-alerts", supportsDataPills: true },
        { key: "text", label: "Message Text", type: "textarea", required: true, supportsDataPills: true, helpText: "Supports Slack mrkdwn: *bold*, _italic_, `code`" },
        { key: "username", label: "Bot Name (optional)", type: "text", placeholder: "Ryzha Bot", supportsDataPills: false },
      ],
      outputSchema: { ok: "boolean", ts: "string", channel: "string" },
      sampleOutput: { ok: true, ts: "1716800000.000100", channel: "C0ABC123" },
      sortOrder: 0,
    },
    {
      slug: "send_dm",
      name: "Send Direct Message",
      description: "Send a DM to a Slack user by email or user ID.",
      inputSchema: [
        { key: "userEmail", label: "User Email", type: "text", required: true, supportsDataPills: true },
        { key: "text", label: "Message Text", type: "textarea", required: true, supportsDataPills: true },
      ],
      outputSchema: { ok: "boolean", ts: "string" },
      sampleOutput: { ok: true, ts: "1716800000.000200" },
      sortOrder: 1,
    },
  ],
}
