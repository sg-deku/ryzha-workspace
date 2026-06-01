import { prisma } from "@/lib/prisma"
import { CONNECTOR_CATALOG } from "./connectors"

export async function seedConnectorCatalog() {
  for (const connector of CONNECTOR_CATALOG) {
    const saved = await prisma.wsConnector.upsert({
      where: { slug: connector.slug },
      update: {
        name: connector.name,
        description: connector.description,
        category: connector.category,
        color: connector.color,
        authType: connector.authType,
        isActive: connector.isActive ?? true,
        isPremium: connector.isPremium ?? false,
        sortOrder: connector.sortOrder ?? 0,
      },
      create: {
        slug: connector.slug,
        name: connector.name,
        description: connector.description,
        category: connector.category,
        color: connector.color,
        authType: connector.authType,
        isActive: connector.isActive ?? true,
        isPremium: connector.isPremium ?? false,
        sortOrder: connector.sortOrder ?? 0,
      },
    })

    for (const trigger of connector.triggers) {
      await prisma.wsConnectorTrigger.upsert({
        where: { connectorId_slug: { connectorId: saved.id, slug: trigger.slug } },
        update: {
          name: trigger.name,
          description: trigger.description,
          inputSchema: trigger.inputSchema as any,
          outputSchema: trigger.outputSchema as any,
          sampleOutput: trigger.sampleOutput as any,
          sortOrder: trigger.sortOrder ?? 0,
        },
        create: {
          connectorId: saved.id,
          slug: trigger.slug,
          name: trigger.name,
          description: trigger.description,
          inputSchema: trigger.inputSchema as any,
          outputSchema: trigger.outputSchema as any,
          sampleOutput: trigger.sampleOutput as any,
          sortOrder: trigger.sortOrder ?? 0,
        },
      })
    }

    for (const action of connector.actions) {
      await prisma.wsConnectorAction.upsert({
        where: { connectorId_slug: { connectorId: saved.id, slug: action.slug } },
        update: {
          name: action.name,
          description: action.description,
          inputSchema: action.inputSchema as any,
          outputSchema: action.outputSchema as any,
          sampleOutput: action.sampleOutput as any,
          sortOrder: action.sortOrder ?? 0,
        },
        create: {
          connectorId: saved.id,
          slug: action.slug,
          name: action.name,
          description: action.description,
          inputSchema: action.inputSchema as any,
          outputSchema: action.outputSchema as any,
          sampleOutput: action.sampleOutput as any,
          sortOrder: action.sortOrder ?? 0,
        },
      })
    }
  }
}
