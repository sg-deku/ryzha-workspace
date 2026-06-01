export type ConnectorCategory =
  | "finance"
  | "crm"
  | "commerce"
  | "communication"
  | "data"
  | "developer"
  | "logic"

export type AuthType = "none" | "apikey" | "oauth2" | "basic"

export interface FieldSchema {
  key: string
  label: string
  type: "text" | "number" | "boolean" | "select" | "textarea" | "password" | "url"
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: { label: string; value: string }[]
  supportsDataPills?: boolean
}

export interface ConnectorTriggerDef {
  slug: string
  name: string
  description: string
  inputSchema: FieldSchema[]
  outputSchema: Record<string, unknown>
  sampleOutput: Record<string, unknown>
  sortOrder?: number
}

export interface ConnectorActionDef {
  slug: string
  name: string
  description: string
  inputSchema: FieldSchema[]
  outputSchema: Record<string, unknown>
  sampleOutput: Record<string, unknown>
  sortOrder?: number
}

export interface ConnectorDef {
  slug: string
  name: string
  description: string
  category: ConnectorCategory
  iconUrl?: string
  color: string
  authType: AuthType
  isActive?: boolean
  isPremium?: boolean
  sortOrder?: number
  triggers: ConnectorTriggerDef[]
  actions: ConnectorActionDef[]
}
