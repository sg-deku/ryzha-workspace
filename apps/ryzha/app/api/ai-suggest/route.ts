import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { invokeAI, parseAIJson } from "@/lib/ai/client"

export const dynamic = "force-dynamic"

const PROMPTS: Record<string, (input: string) => string> = {
  expense: (input) => `You are a financial assistant. The user described an expense in natural language.
Extract structured data and respond with ONLY a raw JSON object (no markdown, no backticks).

User input: "${input}"

Respond with this exact structure:
{
  "description": "concise expense description",
  "amount": 0,
  "category": "one of: Software, Hardware, Office Supplies, Travel, Meals, Legal, Marketing, Utilities, Rent, Salaries, Other",
  "date": "${new Date().toISOString().split("T")[0]}",
  "notes": "optional additional context"
}`,

  purchase: (input) => `You are a procurement assistant. The user described items they want to purchase.
Extract line items and respond with ONLY a raw JSON object (no markdown, no backticks).

User input: "${input}"

Respond with this exact structure:
{
  "vendorHint": "suggested vendor name if mentioned, else empty string",
  "items": [
    { "description": "item description", "quantity": 1, "unitPrice": 0 }
  ]
}`,

  customer: (input) => `You are a CRM assistant. The user described a new customer.
Extract customer details and respond with ONLY a raw JSON object (no markdown, no backticks).

User input: "${input}"

Respond with this exact structure:
{
  "name": "company or person name",
  "email": "email if mentioned, else empty string",
  "taxId": "tax ID if mentioned, else empty string",
  "creditLimit": 5000,
  "notes": "any additional context"
}`,

  vendor: (input) => `You are a procurement assistant. The user described a new vendor/supplier.
Extract vendor details and respond with ONLY a raw JSON object (no markdown, no backticks).

User input: "${input}"

Respond with this exact structure:
{
  "name": "vendor/company name",
  "email": "email if mentioned, else empty string",
  "taxId": "tax ID or registration number if mentioned, else empty string",
  "paymentTerms": "one of: NET15, NET30, NET45, NET60, IMMEDIATE — default NET30",
  "notes": "any additional context"
}`,

  "sales-order": (input) => `You are a sales assistant. The user described items for a sales order.
Extract line items and respond with ONLY a raw JSON object (no markdown, no backticks).

User input: "${input}"

Respond with this exact structure:
{
  "customerHint": "suggested customer name if mentioned, else empty string",
  "deliveryDate": "${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}",
  "items": [
    { "description": "item description", "quantity": 1, "unitPrice": 0 }
  ]
}`,
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { type, prompt } = await req.json()
  if (!type || !prompt) return NextResponse.json({ error: "type and prompt are required" }, { status: 400 })

  const promptFn = PROMPTS[type]
  if (!promptFn) return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })

  try {
    const raw = await invokeAI(orgId, promptFn(prompt), { temperature: 0.3, feature: `ai-suggest-${type}` })
    const parsed = parseAIJson(raw)
    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error("[ai-suggest] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
