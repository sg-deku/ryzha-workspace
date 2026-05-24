import { prisma } from "@/lib/prisma"
import { getRunway } from "@/lib/reports/static/runway"
import { getCashFlow } from "@/lib/reports/static/cashflow"
import { getProfitLoss } from "@/lib/reports/static/pl"
import { getExpensesByCategory } from "@/lib/reports/static/expenses"

export const CHAT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_runway",
      description: "Get the company's runway: how many months of cash remain based on bank balance and monthly burn rate.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_cash_flow",
      description: "Get cash inflows and outflows by month for a date range.",
      parameters: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date in YYYY-MM-DD format. Defaults to 6 months ago." },
          endDate: { type: "string", description: "End date in YYYY-MM-DD format. Defaults to today." },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_profit_loss",
      description: "Get profit and loss (P&L) summary including total revenue, expenses, and net profit for a period.",
      parameters: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date in YYYY-MM-DD format. Defaults to 3 months ago." },
          endDate: { type: "string", description: "End date in YYYY-MM-DD format. Defaults to today." },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_expenses_by_category",
      description: "Get a breakdown of expenses by category for a date range.",
      parameters: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "Start date in YYYY-MM-DD format. Defaults to 3 months ago." },
          endDate: { type: "string", description: "End date in YYYY-MM-DD format. Defaults to today." },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_outstanding_invoices",
      description: "Get a list of unpaid/overdue invoices with client name, amount due, and due date.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_burn_rate",
      description: "Get the monthly burn rate (average monthly expenses) and the average monthly revenue.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_top_clients",
      description: "Get the top clients by revenue.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of top clients to return. Defaults to 5." },
        },
        required: [],
      },
    },
  },
]

export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  orgId: string
): Promise<string> {
  try {
    switch (toolName) {
      case "get_runway": {
        const data = await getRunway({}, orgId)
        if (!data.bankBalance && !data.averageMonthlyExpenses) {
          return "Runway data is not available. Please configure your bank balance and monthly expenses in Settings → Financial Engine."
        }
        return JSON.stringify({
          bankBalance: data.bankBalance,
          monthlyBurnRate: data.averageMonthlyExpenses,
          runwayMonths: data.runwayMonths,
          zeroCashDate: data.zeroCashDate,
        })
      }

      case "get_cash_flow": {
        const data = await getCashFlow(args, orgId)
        if (data.length === 0) return "No cash flow data found for the specified period."
        const totalInflow = data.reduce((s, r) => s + r.inflow, 0)
        const totalOutflow = data.reduce((s, r) => s + r.outflow, 0)
        return JSON.stringify({
          months: data,
          summary: { totalInflow, totalOutflow, netCashFlow: totalInflow - totalOutflow },
        })
      }

      case "get_profit_loss": {
        const data = await getProfitLoss(args, orgId)
        return JSON.stringify(data)
      }

      case "get_expenses_by_category": {
        const data = await getExpensesByCategory(args, orgId)
        if (data.length === 0) return "No expenses found for the specified period."
        const total = data.reduce((s, e) => s + e.value, 0)
        return JSON.stringify({ categories: data, total })
      }

      case "get_outstanding_invoices": {
        const invoices = await prisma.invoice.findMany({
          where: {
            organizationId: orgId,
            status: { in: ["SENT", "OVERDUE"] },
          },
          select: {
            clientName: true,
            invoiceNumber: true,
            total: true,
            dueDate: true,
            status: true,
          },
          orderBy: { dueDate: "asc" },
          take: 20,
        })
        if (invoices.length === 0) return "No outstanding invoices."
        const totalOutstanding = invoices.reduce((s, i) => s + i.total, 0)
        return JSON.stringify({
          count: invoices.length,
          totalOutstanding,
          invoices: invoices.map(i => ({
            client: i.clientName,
            invoiceNumber: i.invoiceNumber,
            amount: i.total,
            dueDate: i.dueDate?.toISOString().split("T")[0] ?? null,
            status: i.status,
          })),
        })
      }

      case "get_burn_rate": {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

        const [expenses, revenue] = await Promise.all([
          prisma.expense.aggregate({
            where: { organizationId: orgId, date: { gte: threeMonthsAgo } },
            _sum: { amount: true },
          }),
          prisma.invoice.aggregate({
            where: {
              organizationId: orgId,
              issueDate: { gte: threeMonthsAgo },
              status: { in: ["PAID", "SENT"] },
            },
            _sum: { total: true },
          }),
        ])

        const totalExpenses = expenses._sum.amount ?? 0
        const totalRevenue = revenue._sum.total ?? 0
        const avgMonthlyBurn = totalExpenses / 3
        const avgMonthlyRevenue = totalRevenue / 3

        return JSON.stringify({
          avgMonthlyBurnRate: avgMonthlyBurn,
          avgMonthlyRevenue: avgMonthlyRevenue,
          netBurnRate: avgMonthlyBurn - avgMonthlyRevenue,
          periodMonths: 3,
        })
      }

      case "get_top_clients": {
        const limit = args.limit ?? 5
        const invoices = await prisma.invoice.findMany({
          where: { organizationId: orgId, status: { not: "VOID" } },
          select: { clientName: true, clientEmail: true, total: true },
        })

        const byClient: Record<string, { name: string; email: string; total: number }> = {}
        for (const inv of invoices) {
          const key = inv.clientEmail || inv.clientName
          if (!byClient[key]) byClient[key] = { name: inv.clientName, email: inv.clientEmail || "", total: 0 }
          byClient[key].total += inv.total
        }

        const sorted = Object.values(byClient)
          .sort((a, b) => b.total - a.total)
          .slice(0, limit)

        return JSON.stringify({ clients: sorted })
      }

      default:
        return "Unknown tool."
    }
  } catch (err: any) {
    console.error(`[chat-tool] ${toolName} error:`, err)
    return `Error fetching data: ${err.message}`
  }
}
