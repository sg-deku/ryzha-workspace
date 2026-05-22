import { retrieveRelevantContext } from "./vector-store"

export async function getFinancialContext(query: string, organizationId: string) {
  const context = await retrieveRelevantContext(query, organizationId)
  return context
}
