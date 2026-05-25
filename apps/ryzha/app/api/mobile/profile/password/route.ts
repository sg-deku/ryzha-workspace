import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: "currentPassword and newPassword are required" }, { status: 400 })

  if (newPassword.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, password: true },
  })

  if (!user || !user.password)
    return NextResponse.json({ error: "User not found" }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid)
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })

  const hashed = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: session.userId },
    data: { password: hashed },
  })

  return NextResponse.json({ success: true })
}
