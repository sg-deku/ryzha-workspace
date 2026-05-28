import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getNextEntityNumber } from "@/lib/sequences"

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  creditLimit: z.number().min(0).default(5000),
  paymentTerms: z.string().optional().default("NET30"),
  status: z.string().default("ACTIVE"),
  notes: z.string().optional().or(z.literal("")),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
})

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const customers = await prisma.customer.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" }
    })
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = customerSchema.parse(body)
    const customerNumber = await getNextEntityNumber(session.user.organizationId, "CUSTOMER")

    const customer = await prisma.customer.create({
      data: {
        ...data,
        customerNumber,
        email: data.email || null,
        phone: data.phone || null,
        taxId: data.taxId || null,
        notes: data.notes || null,
        address: data.address ?? undefined,
        organizationId: session.user.organizationId,
      }
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
