import type { ConnectorDef } from "../types"

export const httpConnector: ConnectorDef = {
  slug: "http",
  name: "HTTP Request",
  description: "Call any REST API with a custom HTTP request. No authentication required for public endpoints.",
  category: "developer",
  color: "#64748b",
  authType: "none",
  sortOrder: 10,
  triggers: [
    {
      slug: "inbound_webhook",
      name: "Inbound Webhook",
      description: "Receive data from any external system via a unique webhook URL.",
      inputSchema: [
        { key: "secret", label: "Webhook Secret (optional)", type: "password", helpText: "Used to verify the HMAC-SHA256 signature of incoming requests." },
      ],
      outputSchema: {
        headers: "object",
        body: "object",
        method: "string",
        receivedAt: "string",
      },
      sampleOutput: {
        headers: { "content-type": "application/json" },
        body: { event: "payment.succeeded", amount: 4500 },
        method: "POST",
        receivedAt: "2026-05-15T10:00:00Z",
      },
      sortOrder: 0,
    },
  ],
  actions: [
    {
      slug: "request",
      name: "HTTP Request",
      description: "Make an HTTP request to any REST API endpoint.",
      inputSchema: [
        { key: "method", label: "Method", type: "select", required: true, options: [{ label: "GET", value: "GET" }, { label: "POST", value: "POST" }, { label: "PUT", value: "PUT" }, { label: "PATCH", value: "PATCH" }, { label: "DELETE", value: "DELETE" }] },
        { key: "url", label: "URL", type: "url", required: true, supportsDataPills: true, placeholder: "https://api.example.com/endpoint" },
        { key: "headers", label: "Headers (JSON)", type: "textarea", placeholder: '{"Authorization":"Bearer ...","Content-Type":"application/json"}', supportsDataPills: true },
        { key: "body", label: "Body (JSON)", type: "textarea", supportsDataPills: true },
      ],
      outputSchema: {
        status: "number",
        statusText: "string",
        body: "object",
        headers: "object",
      },
      sampleOutput: {
        status: 200,
        statusText: "OK",
        body: { id: "abc", success: true },
        headers: { "content-type": "application/json" },
      },
      sortOrder: 0,
    },
  ],
}
