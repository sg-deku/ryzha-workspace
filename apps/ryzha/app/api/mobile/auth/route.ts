import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signMobileToken } from "@/lib/mobile-auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organizations: {
          take: 1,
          include: {
            role: true,
            organization: { select: { status: true } },
          },
        },
      },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const userOrg = user.organizations[0]
    if (!userOrg) {
      return NextResponse.json({ error: "No organisation found for this user" }, { status: 403 })
    }

    if (userOrg.organization?.status === "SUSPENDED") {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 })
    }

    if (userOrg.organization?.status === "PENDING") {
      return NextResponse.json({ error: "Account pending approval" }, { status: 403 })
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: userOrg.organizationId,
      role: userOrg.role?.name || "MEMBER",
      orgStatus: userOrg.organization?.status || "ACTIVE",
    }

    const token = await signMobileToken(payload)

    return NextResponse.json({ token, user: payload })
  } catch (err) {
    console.error("[mobile/auth]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
