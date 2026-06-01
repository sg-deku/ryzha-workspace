import type { ConnectorDef } from "../types"

export const hubspotConnector: ConnectorDef = {
  slug: "hubspot",
  name: "HubSpot",
  description: "Sync contacts, deals, and companies with HubSpot CRM.",
  category: "crm",
  color: "#ff7a59",
  authType: "oauth2",
  isPremium: false,
  sortOrder: 30,
  triggers: [
    {
      slug: "deal_stage_changed",
      name: "Deal Stage Changed",
      description: "Fires when a deal moves to a new pipeline stage.",
      inputSchema: [
        { key: "pipelineId", label: "Pipeline ID (optional)", type: "text", placeholder: "Filter by pipeline" },
        { key: "toStage", label: "To Stage (optional)", type: "text", placeholder: "closedwon" },
      ],
      outputSchema: {
        deal: { id: "string", name: "string", amount: "number", stage: "string", closeDate: "string", ownerId: "string", contactEmail: "string" },
      },
      sampleOutput: {
        deal: { id: "hs_deal_123", name: "Acme Corp - Enterprise", amount: 50000, stage: "closedwon", closeDate: "2026-06-01", ownerId: "user_1", contactEmail: "ceo@acme.com" },
      },
      sortOrder: 0,
    },
    {
      slug: "contact_created",
      name: "Contact Created",
      description: "Fires when a new contact is created in HubSpot.",
      inputSchema: [],
      outputSchema: {
        contact: { id: "string", email: "string", firstName: "string", lastName: "string", company: "string", phone: "string" },
      },
      sampleOutput: {
        contact: { id: "hs_contact_456", email: "john@acme.com", firstName: "John", lastName: "Smith", company: "Acme Corp", phone: "+1-555-0100" },
      },
      sortOrder: 1,
    },
  ],
  actions: [
    {
      slug: "create_deal",
      name: "Create Deal",
      description: "Create a new deal in HubSpot CRM.",
      inputSchema: [
        { key: "dealName", label: "Deal Name", type: "text", required: true, supportsDataPills: true },
        { key: "amount", label: "Amount", type: "number", supportsDataPills: true },
        { key: "stage", label: "Stage", type: "text", placeholder: "appointmentscheduled", supportsDataPills: true },
        { key: "closeDate", label: "Close Date (YYYY-MM-DD)", type: "text", supportsDataPills: true },
        { key: "contactEmail", label: "Contact Email", type: "text", supportsDataPills: true },
      ],
      outputSchema: { deal: { id: "string", name: "string" } },
      sampleOutput: { deal: { id: "hs_deal_new", name: "Acme Corp Deal" } },
      sortOrder: 0,
    },
    {
      slug: "update_contact",
      name: "Update Contact",
      description: "Update properties on an existing HubSpot contact.",
      inputSchema: [
        { key: "email", label: "Contact Email", type: "text", required: true, supportsDataPills: true },
        { key: "properties", label: "Properties (JSON)", type: "textarea", supportsDataPills: true, placeholder: '{"lifecycle_stage":"customer","company":"Acme Corp"}' },
      ],
      outputSchema: { contact: { id: "string", email: "string" } },
      sampleOutput: { contact: { id: "hs_contact_456", email: "john@acme.com" } },
      sortOrder: 1,
    },
    {
      slug: "create_note",
      name: "Create Note",
      description: "Add a note to a HubSpot contact or deal.",
      inputSchema: [
        { key: "body", label: "Note Body", type: "textarea", required: true, supportsDataPills: true },
        { key: "contactEmail", label: "Contact Email (optional)", type: "text", supportsDataPills: true },
        { key: "dealId", label: "Deal ID (optional)", type: "text", supportsDataPills: true },
      ],
      outputSchema: { note: { id: "string" } },
      sampleOutput: { note: { id: "hs_note_789" } },
      sortOrder: 2,
    },
  ],
}
