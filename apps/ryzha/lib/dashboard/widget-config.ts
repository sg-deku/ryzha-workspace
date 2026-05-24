export interface WidgetConfig {
  id: string
  visible: boolean
  order: number
  halfWidth?: boolean
  settings?: Record<string, any>
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfig[] = [
  { id: "kpi_row",             visible: true,  order: 1, halfWidth: false },
  { id: "alerts_row",          visible: true,  order: 2, halfWidth: false },
  { id: "real_time_pl",        visible: true,  order: 3, halfWidth: false, settings: { dateRangePreset: "this_month" } },
  { id: "cash_flow",           visible: true,  order: 4, halfWidth: true  },
  { id: "anomaly_alerts",      visible: true,  order: 5, halfWidth: true  },
  { id: "recent_transactions", visible: true,  order: 6, halfWidth: false },
  { id: "agent_log",           visible: true,  order: 7, halfWidth: true  },
  { id: "ai_usage",            visible: true,  order: 8, halfWidth: true  },
]

export const WIDGET_META: Record<string, { title: string; description: string }> = {
  kpi_row:             { title: "Key Metrics",             description: "Runway, burn rate, cash balance and revenue" },
  alerts_row:          { title: "Action Alerts",           description: "Pending PO approvals and overdue invoices" },
  real_time_pl:        { title: "Profit & Loss",           description: "Real-time P&L with date filter" },
  cash_flow:           { title: "Cash Flow Forecast",      description: "AI-powered 12-month cash forecast" },
  agent_log:           { title: "Agent Log",               description: "Recent AI agent activity" },
  anomaly_alerts:      { title: "Anomaly & Audit Alerts",  description: "AI-detected expense anomalies and audit flags" },
  recent_transactions: { title: "Recent Transactions",     description: "Latest reconciled transactions" },
  ai_usage:            { title: "AI Token Usage",          description: "Today / this month / all-time token consumption" },
}
