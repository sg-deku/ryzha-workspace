import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    // For security, don't reveal if user exists
    if (!user) {
      return NextResponse.json({ message: "If an account with that email exists, we have sent a reset link." })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 3600000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry
      }
    })

    // Mock email sending
    console.log(`Password reset link for ${email}: ${process.env.NEXTAUTH_URL}/reset-password/${token}`)

    return NextResponse.json({ message: "If an account with that email exists, we have sent a reset link." })
  } catch (error: any) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
