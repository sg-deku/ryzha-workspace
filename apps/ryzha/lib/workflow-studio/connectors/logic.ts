import type { ConnectorDef } from "../types"

export const conditionConnector: ConnectorDef = {
  slug: "condition",
  name: "Condition",
  description: "Branch the workflow based on a true/false expression.",
  category: "logic",
  color: "#f97316",
  authType: "none",
  sortOrder: 50,
  triggers: [],
  actions: [
    {
      slug: "if_else",
      name: "If / Else",
      description: "Evaluate an expression and route to true or false branch.",
      inputSchema: [
        { key: "expression", label: "Condition Expression", type: "textarea", required: true, supportsDataPills: true, placeholder: "{{trigger.invoice.amount}} > 10000", helpText: "Use {{node.field}} data pills. Evaluated as a JavaScript expression." },
      ],
      outputSchema: { result: "boolean", expression: "string" },
      sampleOutput: { result: true, expression: "4500 > 1000" },
      sortOrder: 0,
    },
  ],
}

export const transformConnector: ConnectorDef = {
  slug: "transform",
  name: "Transform",
  description: "Reshape or transform the data payload using a JSONata expression.",
  category: "logic",
  color: "#8b5cf6",
  authType: "none",
  sortOrder: 51,
  triggers: [],
  actions: [
    {
      slug: "map",
      name: "Map / Transform Data",
      description: "Apply a JSONata expression to transform the input payload into a new shape.",
      inputSchema: [
        { key: "expression", label: "JSONata Expression", type: "textarea", required: true, supportsDataPills: false, placeholder: '{ "name": trigger.customerName, "total": trigger.invoice.amount * 1.1 }', helpText: "Full JSONata syntax supported. See jsonata.org." },
      ],
      outputSchema: { result: "object" },
      sampleOutput: { result: { name: "Acme Corp", total: 4950 } },
      sortOrder: 0,
    },
  ],
}

export const loopConnector: ConnectorDef = {
  slug: "loop",
  name: "Loop",
  description: "Iterate over an array field and run downstream nodes for each item.",
  category: "logic",
  color: "#10b981",
  authType: "none",
  sortOrder: 52,
  triggers: [],
  actions: [
    {
      slug: "for_each",
      name: "For Each",
      description: "Loop over every item in an array. Downstream nodes receive each item individually.",
      inputSchema: [
        { key: "arrayField", label: "Array to iterate", type: "text", required: true, supportsDataPills: true, placeholder: "{{ryzha.query_gl.entries}}" },
      ],
      outputSchema: { item: "object", index: "number", total: "number" },
      sampleOutput: { item: { id: "gl_abc", accountName: "Revenue", credit: 4500 }, index: 0, total: 12 },
      sortOrder: 0,
    },
  ],
}

export const delayConnector: ConnectorDef = {
  slug: "delay",
  name: "Delay",
  description: "Pause the workflow for a specified duration before continuing.",
  category: "logic",
  color: "#94a3b8",
  authType: "none",
  sortOrder: 53,
  triggers: [],
  actions: [
    {
      slug: "wait",
      name: "Wait",
      description: "Pause execution for a fixed amount of time.",
      inputSchema: [
        { key: "duration", label: "Duration", type: "number", required: true, placeholder: "30" },
        { key: "unit", label: "Unit", type: "select", required: true, options: [{ label: "Seconds", value: "seconds" }, { label: "Minutes", value: "minutes" }, { label: "Hours", value: "hours" }] },
      ],
      outputSchema: { resumedAt: "string", waitedMs: "number" },
      sampleOutput: { resumedAt: "2026-05-15T10:30:00Z", waitedMs: 1800000 },
      sortOrder: 0,
    },
  ],
}

export const stopConnector: ConnectorDef = {
  slug: "stop",
  name: "Stop",
  description: "Halt the workflow at this point, optionally with a message.",
  category: "logic",
  color: "#ef4444",
  authType: "none",
  sortOrder: 54,
  triggers: [],
  actions: [
    {
      slug: "halt",
      name: "Stop Workflow",
      description: "Terminate the workflow immediately with an optional message.",
      inputSchema: [
        { key: "message", label: "Reason / Message", type: "text", supportsDataPills: true, placeholder: "Stopped: condition not met" },
      ],
      outputSchema: { stoppedAt: "string", message: "string" },
      sampleOutput: { stoppedAt: "2026-05-15T10:00:00Z", message: "Stopped: condition not met" },
      sortOrder: 0,
    },
  ],
}
