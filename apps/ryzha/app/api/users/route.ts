import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { sendEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!(await hasPermission("users:manage"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await prisma.userOrganization.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true
          }
        },
        role: true
      }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("List users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!(await hasPermission("users:manage"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email, name, roleId } = await req.json()

    if (!email || !name || !roleId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Check organization user quota
    const [orgUsersCount, license] = await Promise.all([
      prisma.userOrganization.count({
        where: { organizationId: session.user.organizationId }
      }),
      prisma.license.findUnique({
        where: { organizationId: session.user.organizationId }
      })
    ])

    const maxUsers = license?.maxUsers ?? 5 // Default fallback if no license

    if (orgUsersCount >= maxUsers) {
      return NextResponse.json(
        { error: `User limit reached. Your plan allows a maximum of ${maxUsers} users.` },
        { status: 403 }
      )
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // Check if already in this org
      const existingMembership = await prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: session.user.organizationId
          }
        }
      })
      if (existingMembership) {
        return NextResponse.json({ error: "User already in organization" }, { status: 400 })
      }
    } else {
      // Create invited user
      user = await prisma.user.create({
        data: {
          email,
          name,
          status: "INVITED"
        }
      })
    }

    await prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: session.user.organizationId,
        roleId: roleId
      }
    })

    await prisma.auditLog.create({
      data: {
        action: "INVITE_USER",
        entityType: "USER",
        entityId: user.id,
        actorId: session.user.id,
        organizationId: session.user.organizationId,
        details: { email, name, roleId }
      }
    })

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { name: true }
    })

    const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`

    sendEmail({
      to: email,
      subject: `You've been invited to join ${org?.name ?? "Ryzha"}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111;">
          <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;">You're invited!</h1>
          <p style="font-size:16px;line-height:1.6;margin-bottom:16px;">
            Hi ${name}, you've been invited to join <strong>${org?.name ?? "Ryzha"}</strong> on Ryzha.
          </p>
          <p style="font-size:16px;line-height:1.6;margin-bottom:24px;">
            Log in with this email address to get started:
          </p>
          <a href="${loginUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
            Accept Invitation
          </a>
          <p style="font-size:14px;color:#666;margin-top:32px;">— The Ryzha Team</p>
        </div>
      `,
    }).catch(err => console.error("[invite] Failed to send invite email:", err))

    return NextResponse.json({ message: "User invited successfully" })
  } catch (error: any) {
    console.error("Invite user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
