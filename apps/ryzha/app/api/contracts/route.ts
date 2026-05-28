export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getNextEntityNumber } from "@/lib/sequences"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const contracts = await prisma.contract.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { signedAt: "desc" },
  })

  return NextResponse.json(contracts)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { stripePaymentIntentId, customerEmail, amount } = body

  if (!stripePaymentIntentId || !customerEmail || !amount) {
    return NextResponse.json(
      { error: "stripePaymentIntentId, customerEmail, and amount are required" },
      { status: 400 }
    )
  }

  try {
    const contractNumber = await getNextEntityNumber(session.user.organizationId, "CONTRACT")

    const contract = await prisma.contract.create({
      data: {
        stripePaymentIntentId,
        customerEmail,
        amount: Number(amount),
        status: "signed",
        contractNumber,
        organizationId: session.user.organizationId,
      },
    })
    return NextResponse.json(contract, { status: 201 })
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A contract with this Payment Intent ID already exists." },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  await prisma.contract.delete({
    where: { id, organizationId: session.user.organizationId },
  })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, stripePaymentIntentId, customerEmail, amount, status } = body

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  try {
    const contract = await prisma.contract.update({
      where: { id, organizationId: session.user.organizationId },
      data: {
        ...(stripePaymentIntentId && { stripePaymentIntentId }),
        ...(customerEmail && { customerEmail }),
        ...(amount && { amount: Number(amount) }),
        ...(status && { status }),
      },
    })
    return NextResponse.json(contract)
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A contract with this Payment Intent ID already exists." },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
