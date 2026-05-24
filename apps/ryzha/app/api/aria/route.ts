import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAIClientConfig, parseAIJson } from "@/lib/ai/client"

export const dynamic = "force-dynamic"

const ARIA_SYSTEM_PROMPT = `You are Aria, Ryzha's intelligent accounting co-pilot. You execute real financial actions on behalf of the user.

When the user gives you an instruction, respond with a JSON object describing what action to take.

Supported actions:
- create_invoice: Create a client invoice
- create_expense: Record an expense
- create_customer: Add a new customer
- create_vendor: Add a new vendor
- create_purchase_order: Create a purchase order
- create_sales_order: Create a sales order
- query_invoices: List/search invoices
- query_expenses: List/search expenses
- query_customers: List customers
- query_vendors: List vendors
- query_financial_summary: Get financial overview (runway, burn rate, etc.)
- none: Cannot execute — explain why in the message field

Respond ONLY with raw JSON (no markdown backticks). Structure:
{
  "action": "action_name",
  "message": "What you are doing or why you cannot do it",
  "params": {
    ... action-specific parameters ...
  }
}

For create_invoice params:
{
  "customerName": string,
  "customerEmail": string (optional),
  "lineItems": [{ "description": string, "quantity": number, "unitPrice": number, "taxRate": number }],
  "dueDate": "YYYY-MM-DD" (optional, default 30 days from now),
  "notes": string (optional)
}

For create_expense params:
{
  "description": string,
  "amount": number,
  "category": string,
  "date": "YYYY-MM-DD",
  "notes": string (optional)
}

For create_customer params:
{
  "name": string,
  "email": string (optional),
  "taxId": string (optional),
  "creditLimit": number (default 5000)
}

For create_vendor params:
{
  "name": string,
  "email": string (optional),
  "taxId": string (optional),
  "paymentTerms": "NET15"|"NET30"|"NET45"|"NET60"|"IMMEDIATE"
}

For create_purchase_order params:
{
  "vendorName": string (used to look up vendor),
  "lineItems": [{ "description": string, "quantity": number, "unitPrice": number }]
}

For create_sales_order params:
{
  "customerName": string (used to look up customer),
  "lineItems": [{ "description": string, "quantity": number, "unitPrice": number }],
  "deliveryDate": "YYYY-MM-DD" (optional)
}

For query actions, params can include:
{
  "status": string (optional filter),
  "limit": number (default 10)
}

Be concise and actionable. Today's date is ${new Date().toISOString().split("T")[0]}.`

async function executeAction(action: string, params: any, orgId: string, userId: string): Promise<{
  success: boolean
  entity?: any
  entityType?: string
  entityId?: string
  link?: string
  summary?: string
  error?: string
}> {
  try {
    switch (action) {
      case "create_invoice": {
        const today = new Date()
        const due = params.dueDate ? new Date(params.dueDate) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

        const countRes = await prisma.invoice.count({ where: { organizationId: orgId } })
        const invoiceNumber = `INV-${String(countRes + 1).padStart(4, "0")}`

        const lineItems = (params.lineItems || []).map((li: any) => ({
          description: li.description,
          quantity: li.quantity || 1,
          unitPrice: li.unitPrice || 0,
          taxRate: li.taxRate || 0,
          amount: (li.quantity || 1) * (li.unitPrice || 0),
        }))

        const subtotal = lineItems.reduce((s: number, li: any) => s + li.amount, 0)
        const totalTax = lineItems.reduce((s: number, li: any) => s + (li.amount * li.taxRate) / 100, 0)
        const total = subtotal + totalTax

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            organizationId: orgId,
            clientName: params.customerName,
            clientEmail: params.customerEmail || "",
            issueDate: today,
            dueDate: due,
            subtotal,
            totalTax,
            total,
            status: "DRAFT",
            lineItems: { create: lineItems },
          },
        })

        return {
          success: true,
          entity: invoice,
          entityType: "invoice",
          entityId: invoice.id,
          link: `/invoices/${invoice.id}`,
          summary: `Created invoice **${invoiceNumber}** for **${params.customerName}** — $${total.toFixed(2)} due ${due.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
        }
      }

      case "create_expense": {
        const expense = await prisma.expense.create({
          data: {
            organizationId: orgId,
            description: params.description,
            amount: parseFloat(params.amount),
            category: params.category || "Other",
            date: params.date ? new Date(params.date) : new Date(),
            status: "PENDING",
          },
        })

        return {
          success: true,
          entity: expense,
          entityType: "expense",
          entityId: expense.id,
          link: `/expenses`,
          summary: `Recorded expense: **${params.description}** — $${parseFloat(params.amount).toFixed(2)} (${params.category || "Other"})`,
        }
      }

      case "create_customer": {
        const customer = await prisma.customer.create({
          data: {
            organizationId: orgId,
            name: params.name,
            email: params.email || null,
            taxId: params.taxId || null,
            creditLimit: params.creditLimit || 5000,
            status: "ACTIVE",
          },
        })

        return {
          success: true,
          entity: customer,
          entityType: "customer",
          entityId: customer.id,
          link: `/customers/${customer.id}`,
          summary: `Added customer **${params.name}**${params.email ? ` (${params.email})` : ""}`,
        }
      }

      case "create_vendor": {
        const vendor = await prisma.vendor.create({
          data: {
            organizationId: orgId,
            name: params.name,
            email: params.email || null,
            taxId: params.taxId || null,
            paymentTerms: params.paymentTerms || "NET30",
            status: "ACTIVE",
          },
        })

        return {
          success: true,
          entity: vendor,
          entityType: "vendor",
          entityId: vendor.id,
          link: `/vendors/${vendor.id}`,
          summary: `Added vendor **${params.name}** with ${params.paymentTerms || "NET30"} payment terms`,
        }
      }

      case "create_purchase_order": {
        let vendor = null
        if (params.vendorName) {
          vendor = await prisma.vendor.findFirst({
            where: {
              organizationId: orgId,
              name: { contains: params.vendorName, mode: "insensitive" },
            },
          })
        }

        const lineItems = (params.lineItems || []).map((li: any) => ({
          description: li.description,
          quantity: li.quantity || 1,
          unitPrice: li.unitPrice || 0,
          amount: (li.quantity || 1) * (li.unitPrice || 0),
        }))

        const total = lineItems.reduce((s: number, li: any) => s + li.amount, 0)
        const poNumber = `PO-${Date.now().toString().slice(-6)}`

        const po = await prisma.purchaseOrder.create({
          data: {
            organizationId: orgId,
            vendorId: vendor?.id || null,
            poNumber,
            status: "DRAFT",
            total,
            lineItems: { create: lineItems },
          },
        })

        return {
          success: true,
          entity: po,
          entityType: "purchase_order",
          entityId: po.id,
          link: `/purchases/${po.id}`,
          summary: `Created purchase order **${poNumber}**${vendor ? ` for **${vendor.name}**` : ""} — $${total.toFixed(2)}`,
        }
      }

      case "create_sales_order": {
        let customer = null
        if (params.customerName) {
          customer = await prisma.customer.findFirst({
            where: {
              organizationId: orgId,
              name: { contains: params.customerName, mode: "insensitive" },
            },
          })
        }

        const lineItems = (params.lineItems || []).map((li: any) => ({
          description: li.description,
          quantity: li.quantity || 1,
          unitPrice: li.unitPrice || 0,
          amount: (li.quantity || 1) * (li.unitPrice || 0),
        }))

        const total = lineItems.reduce((s: number, li: any) => s + li.amount, 0)
        const orderNumber = `SO-${Date.now().toString().slice(-6)}`

        const so = await prisma.salesOrder.create({
          data: {
            organizationId: orgId,
            customerId: customer?.id || null,
            orderNumber,
            status: "DRAFT",
            total,
            deliveryDate: params.deliveryDate ? new Date(params.deliveryDate) : null,
            lineItems: { create: lineItems },
          },
        })

        return {
          success: true,
          entity: so,
          entityType: "sales_order",
          entityId: so.id,
          link: `/sales-orders/${so.id}`,
          summary: `Created sales order **${orderNumber}**${customer ? ` for **${customer.name}**` : ""} — $${total.toFixed(2)}`,
        }
      }

      case "query_invoices": {
        const invoices = await prisma.invoice.findMany({
          where: {
            organizationId: orgId,
            ...(params.status ? { status: params.status } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: params.limit || 10,
          select: { id: true, invoiceNumber: true, clientName: true, total: true, status: true, dueDate: true },
        })

        return {
          success: true,
          summary: invoices.length === 0
            ? "No invoices found."
            : invoices.map(inv =>
                `• [${inv.invoiceNumber}](/invoices/${inv.id}) — **${inv.clientName}** $${inv.total.toFixed(2)} (${inv.status})`
              ).join("\n"),
        }
      }

      case "query_expenses": {
        const expenses = await prisma.expense.findMany({
          where: { organizationId: orgId },
          orderBy: { date: "desc" },
          take: params.limit || 10,
          select: { id: true, description: true, amount: true, category: true, date: true, status: true },
        })

        return {
          success: true,
          summary: expenses.length === 0
            ? "No expenses found."
            : expenses.map(e =>
                `• **${e.description}** — $${e.amount.toFixed(2)} (${e.category || "Uncategorized"}) ${new Date(e.date).toLocaleDateString()}`
              ).join("\n"),
        }
      }

      case "query_customers": {
        const customers = await prisma.customer.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: "desc" },
          take: params.limit || 10,
          select: { id: true, name: true, email: true, status: true },
        })

        return {
          success: true,
          summary: customers.length === 0
            ? "No customers found."
            : customers.map(c =>
                `• [${c.name}](/customers/${c.id})${c.email ? ` — ${c.email}` : ""} (${c.status})`
              ).join("\n"),
        }
      }

      case "query_vendors": {
        const vendors = await prisma.vendor.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: "desc" },
          take: params.limit || 10,
          select: { id: true, name: true, email: true, paymentTerms: true },
        })

        return {
          success: true,
          summary: vendors.length === 0
            ? "No vendors found."
            : vendors.map(v =>
                `• [${v.name}](/vendors/${v.id})${v.email ? ` — ${v.email}` : ""} (${v.paymentTerms})`
              ).join("\n"),
        }
      }

      case "query_financial_summary": {
        const [invoiceStats, expenseStats, bankBalance] = await Promise.all([
          prisma.invoice.aggregate({
            where: { organizationId: orgId, status: { in: ["SENT", "PARTIAL"] } },
            _sum: { total: true },
          }),
          prisma.expense.aggregate({
            where: {
              organizationId: orgId,
              date: { gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000) },
            },
            _sum: { amount: true },
          }),
          prisma.bankTransaction.aggregate({
            where: { organizationId: orgId },
            _sum: { amount: true },
          }),
        ])

        const outstanding = invoiceStats._sum.total || 0
        const monthlyBurn = expenseStats._sum.amount || 0
        const balance = bankBalance._sum.amount || 0
        const runway = monthlyBurn > 0 ? (balance / monthlyBurn).toFixed(1) : "∞"

        return {
          success: true,
          summary: `**Financial Overview:**\n• Cash Balance: $${balance.toFixed(2)}\n• Outstanding AR: $${outstanding.toFixed(2)}\n• Monthly Burn (last 30d): $${monthlyBurn.toFixed(2)}\n• Runway: ~${runway} months`,
        }
      }

      case "none":
      default:
        return { success: false, error: "Action not supported" }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId
  const userId = session.user.id
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { message, history = [] } = await req.json()
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 })

  try {
    const { client, model } = await getAIClientConfig(orgId)

    const messages: any[] = [
      { role: "system", content: ARIA_SYSTEM_PROMPT },
      ...history.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ]

    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.2,
    })

    const raw = completion.choices[0]?.message?.content || '{"action":"none","message":"No response"}'

    let parsed: { action: string; message: string; params?: any }
    try {
      parsed = parseAIJson(raw)
    } catch {
      parsed = { action: "none", message: raw }
    }

    let result = null
    if (parsed.action && parsed.action !== "none") {
      result = await executeAction(parsed.action, parsed.params || {}, orgId, userId)
    }

    prisma.aIUsageLog.create({
      data: {
        organizationId: orgId,
        feature: "aria",
        model,
        provider: "org",
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
    }).catch(() => {})

    return NextResponse.json({
      action: parsed.action,
      message: parsed.message,
      result,
    })
  } catch (err: any) {
    console.error("[aria] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ status: "aria-ready" })
}
