import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date, description, amount, category } = await req.json()

    if (!date || !description || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        description,
        amount: Number(amount),
        category: category || null,
        status: "PENDING",
        organizationId: session.user.organizationId,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
