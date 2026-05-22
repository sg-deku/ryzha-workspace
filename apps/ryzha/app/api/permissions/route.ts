import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const permissions = await prisma.permission.findMany()

    return NextResponse.json(permissions)
  } catch (error: any) {
    console.error("List permissions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
