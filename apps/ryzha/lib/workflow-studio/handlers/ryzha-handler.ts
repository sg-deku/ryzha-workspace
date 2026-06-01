import { prisma } from "@/lib/prisma"

interface HandlerInput {
  actionSlug: string
  config: Record<string, unknown>
  organizationId: string
}

export async function executeRyzhaAction({ actionSlug, config, organizationId }: HandlerInput): Promise<Record<string, unknown>> {
  switch (actionSlug) {
    case "query_gl": {
      const entries = await prisma.generalLedgerEntry.findMany({
        where: {
          organizationId,
          ...(config.accountType ? { accountType: config.accountType as string } : {}),
          ...(config.dateFrom || config.dateTo ? {
            date: {
              ...(config.dateFrom ? { gte: new Date(config.dateFrom as string) } : {}),
              ...(config.dateTo ? { lte: new Date(config.dateTo as string) } : {}),
            }
          } : {}),
        },
        take: Math.min(Number(config.limit) || 100, 500),
        orderBy: { date: "desc" },
      })
      return { entries, totalCount: entries.length }
    }

    case "create_customer": {
      const customer = await prisma.customer.create({
        data: {
          organizationId,
          name: config.name as string,
          email: (config.email as string) || null,
          currency: (config.currency as string) || "USD",
          country: (config.country as string) || null,
          status: "ACTIVE",
        },
      })
      return { customer }
    }

    case "create_invoice": {
      const invoice = await prisma.invoice.create({
        data: {
          organizationId,
          customerId: config.customerId as string,
          amount: Number(config.amount),
          currency: (config.currency as string) || "USD",
          dueDate: config.dueDate ? new Date(config.dueDate as string) : undefined,
          description: (config.description as string) || "",
          status: "DRAFT",
        },
      })
      return { invoice }
    }

    case "fetch_report": {
      return {
        reportType: config.reportType,
        asOf: config.dateTo || new Date().toISOString().split("T")[0],
        data: { message: "Report data available — connect to your report route for full output." },
      }
    }

    default:
      throw new Error(`Unknown Ryzha action: ${actionSlug}`)
  }
}
