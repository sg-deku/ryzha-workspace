import type { ConnectorDef } from "../types"

export const googleSheetsConnector: ConnectorDef = {
  slug: "google-sheets",
  name: "Google Sheets",
  description: "Read and write data to Google Sheets spreadsheets.",
  category: "data",
  color: "#34a853",
  authType: "oauth2",
  sortOrder: 60,
  triggers: [
    {
      slug: "row_added",
      name: "New Row Added",
      description: "Fires when a new row is appended to a sheet (polled every 5 minutes).",
      inputSchema: [
        { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", required: true, helpText: "Found in the Google Sheets URL." },
        { key: "sheetName", label: "Sheet Name", type: "text", placeholder: "Sheet1", required: true },
      ],
      outputSchema: {
        row: "object",
        rowNumber: "number",
        spreadsheetId: "string",
      },
      sampleOutput: {
        row: { A: "Acme Corp", B: "4500", C: "USD", D: "2026-05-15" },
        rowNumber: 42,
        spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
      },
      sortOrder: 0,
    },
  ],
  actions: [
    {
      slug: "append_row",
      name: "Append Row",
      description: "Add a new row to the bottom of a sheet.",
      inputSchema: [
        { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", required: true, supportsDataPills: true },
        { key: "sheetName", label: "Sheet Name", type: "text", placeholder: "Sheet1", required: true, supportsDataPills: true },
        { key: "values", label: "Values (JSON array)", type: "textarea", required: true, supportsDataPills: true, placeholder: '["Acme Corp", "{{trigger.invoice.amount}}", "USD"]', helpText: "Ordered list of cell values for the new row." },
      ],
      outputSchema: { updatedRange: "string", updatedRows: "number" },
      sampleOutput: { updatedRange: "Sheet1!A42:D42", updatedRows: 1 },
      sortOrder: 0,
    },
    {
      slug: "update_row",
      name: "Update Row",
      description: "Update values in a specific row range.",
      inputSchema: [
        { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", required: true, supportsDataPills: true },
        { key: "range", label: "Range (A1 notation)", type: "text", required: true, supportsDataPills: true, placeholder: "Sheet1!A2:D2" },
        { key: "values", label: "Values (JSON array)", type: "textarea", required: true, supportsDataPills: true },
      ],
      outputSchema: { updatedRange: "string", updatedCells: "number" },
      sampleOutput: { updatedRange: "Sheet1!A2:D2", updatedCells: 4 },
      sortOrder: 1,
    },
  ],
}
