import { ryzhaConnector } from "./ryzha"
import { httpConnector } from "./http"
import { slackConnector } from "./slack"
import { emailConnector } from "./email"
import { scheduleConnector } from "./schedule"
import { conditionConnector, transformConnector, loopConnector, delayConnector, stopConnector } from "./logic"
import { hubspotConnector } from "./hubspot"
import { stripeConnector } from "./stripe"
import { googleSheetsConnector } from "./google-sheets"
import type { ConnectorDef } from "../types"

export const CONNECTOR_CATALOG: ConnectorDef[] = [
  ryzhaConnector,
  scheduleConnector,
  httpConnector,
  slackConnector,
  emailConnector,
  hubspotConnector,
  stripeConnector,
  googleSheetsConnector,
  conditionConnector,
  transformConnector,
  loopConnector,
  delayConnector,
  stopConnector,
]

export const CONNECTOR_BY_SLUG = Object.fromEntries(
  CONNECTOR_CATALOG.map((c) => [c.slug, c])
) as Record<string, ConnectorDef>

export const CATEGORY_LABELS: Record<string, string> = {
  finance: "Finance & ERP",
  crm: "CRM",
  commerce: "Commerce",
  communication: "Communication",
  data: "Data & Productivity",
  developer: "Developer",
  logic: "Logic & Flow",
}

export const CATEGORY_ORDER = ["finance", "crm", "commerce", "communication", "data", "developer", "logic"]
