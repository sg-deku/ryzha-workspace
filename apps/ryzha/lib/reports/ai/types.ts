export type ReportType =
  | "revenue_by_month"
  | "expenses_by_category"
  | "runway"
  | "ar_aging"
  | "spend_by_vendor"
  | "profit_loss"
  | "cash_flow"

export interface StructuredQuery {
  reportType: ReportType
  parameters: {
    startDate?: string
    endDate?: string
    customerId?: string
    vendorId?: string
    limit?: number
  }
}

export interface AIReportResponse {
  data: any
  summary: string
  chartType?: "line" | "bar" | "pie" | "table"
}
