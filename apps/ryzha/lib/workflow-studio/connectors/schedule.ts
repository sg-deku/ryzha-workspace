import type { ConnectorDef } from "../types"

export const scheduleConnector: ConnectorDef = {
  slug: "schedule",
  name: "Schedule",
  description: "Trigger workflows on a recurring schedule — daily, weekly, monthly, or custom cron.",
  category: "developer",
  color: "#f59e0b",
  authType: "none",
  sortOrder: 1,
  triggers: [
    {
      slug: "recurring",
      name: "Recurring Schedule",
      description: "Trigger on a cron schedule or simple interval.",
      inputSchema: [
        {
          key: "frequency",
          label: "Frequency",
          type: "select",
          required: true,
          options: [
            { label: "Daily", value: "daily" },
            { label: "Weekly", value: "weekly" },
            { label: "Monthly (1st)", value: "monthly" },
            { label: "Custom cron", value: "cron" },
          ],
        },
        { key: "cronExpr", label: "Cron Expression", type: "text", placeholder: "0 9 * * MON", helpText: "Only used when frequency is 'Custom cron'. Uses UTC." },
        { key: "timezone", label: "Timezone", type: "text", placeholder: "UTC", helpText: "e.g. America/New_York" },
      ],
      outputSchema: {
        scheduledAt: "string",
        timestamp: "number",
        frequency: "string",
      },
      sampleOutput: {
        scheduledAt: "2026-06-01T09:00:00Z",
        timestamp: 1748768400,
        frequency: "monthly",
      },
      sortOrder: 0,
    },
  ],
  actions: [],
}
