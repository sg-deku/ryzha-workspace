import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"

export async function runOrderIntakeAgent(organizationId: string, input: { text: string }) {
  try {
    const response = await callLLM(organizationId, [
      { role: "system", content: "Extract sales order details (customer_name, customer_email, items: [{ description, quantity, price }]) from text. Respond in JSON." },
      { role: "user", content: input.text }
    ], "agent_o2c_order_intake", { modelName: "gpt-4o-mini", temperature: 0 })

    const parsed = JSON.parse(response.content as string)
    
    // 1. Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        organizationId,
        OR: [
          { name: { equals: parsed.customer_name, mode: "insensitive" } },
          { email: { equals: parsed.customer_email, mode: "insensitive" } }
        ]
      }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: parsed.customer_name || "Unknown Customer",
          email: parsed.customer_email,
          organizationId
        }
      })
    }

    // 2. Create Sales Order
    const totalAmount = (parsed.items as any[]).reduce((sum, item) => sum + (item.quantity * item.price), 0)
    
    const salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber: `SO-${Date.now()}`,
        customerId: customer.id,
        totalAmount,
        organizationId,
        lineItems: {
          create: (parsed.items as any[]).map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.price,
            amount: item.quantity * item.price
          }))
        }
      },
      include: { lineItems: true }
    })

    return salesOrder
  } catch (error) {
    console.error("Order Intake AI failed", error)
    return null
  }
}
