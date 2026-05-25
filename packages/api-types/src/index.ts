export interface MobileUser {
  id: string
  email: string
  name: string | null
  organizationId: string
  role: string
  orgStatus: string
}

export interface MobileAuthResponse {
  token: string
  user: MobileUser
}

export interface KpiCard {
  title: string
  value: string
  change: string
  data: number[]
}

export interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  clientName: string
  clientEmail: string
  subtotal: number
  totalTax: number
  total: number
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
  createdAt: string
  lineItems?: LineItem[]
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  amount: number
}

export interface Expense {
  id: string
  date: string
  description: string
  amount: number
  category: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
}

export interface Notification {
  id: string
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR"
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface DashboardData {
  kpis: KpiCard[]
}

export interface ApiError {
  error: string
}
