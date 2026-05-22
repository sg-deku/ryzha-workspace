import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  creditLimit: z.number().min(0).default(5000),
  status: z.string().default("ACTIVE"),
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

    const customer = await prisma.customer.create({
      data: {
        ...data,
        email: data.email || null,
        taxId: data.taxId || null,
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
