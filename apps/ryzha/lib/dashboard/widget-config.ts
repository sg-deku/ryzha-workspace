export interface WidgetConfig {
  id: string
  visible: boolean
  order: number
  settings?: Record<string, any>
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfig[] = [
  { id: "kpi_row", visible: true, order: 1 },
  { id: "alerts_row", visible: true, order: 2 },
  { id: "real_time_pl", visible: true, order: 3, settings: { dateRangePreset: "this_month" } },
  { id: "cash_flow", visible: true, order: 4 },
  { id: "agent_log", visible: true, order: 5 },
  { id: "anomaly_alerts", visible: true, order: 6 },
  { id: "recent_transactions", visible: true, order: 7 },
  { id: "ai_usage", visible: true, order: 8 },
]

export const WIDGET_META: Record<string, { title: string; description: string }> = {
  kpi_row: { title: "Key Metrics", description: "Revenue, expenses, invoices and more" },
  alerts_row: { title: "Action Alerts", description: "Pending P2P approvals and overdue O2C" },
  real_time_pl: { title: "Profit & Loss", description: "Real-time P&L widget with date filter" },
  cash_flow: { title: "Cash Flow Forecast", description: "AI-powered 12-month cash forecast" },
  agent_log: { title: "Agent Log", description: "Recent agent activity feed" },
  anomaly_alerts: { title: "Expense Anomalies", description: "AI-detected expense anomalies" },
  recent_transactions: { title: "Recent Transactions", description: "Latest reconciled transactions" },
  ai_usage: { title: "AI Token Usage", description: "Today / this month / all-time token consumption" },
}
