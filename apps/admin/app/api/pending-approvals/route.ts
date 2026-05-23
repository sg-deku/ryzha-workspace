import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const pending = await prisma.organization.findMany({
    where: { status: "PENDING" },
    include: {
      users: {
        include: {
          user: { select: { name: true, email: true } },
          role: true,
        },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(pending)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { organizationId, action, defaultPlanId, maxUsers, maxApiCalls, maxAiTokens, adminNotes, billingContact, aiProvider, aiModel, aiApiKey } = body

  if (action === "approve") {
    const defaultPlan = defaultPlanId
      ? await prisma.subscriptionPlan.findUnique({ where: { id: defaultPlanId } })
      : await prisma.subscriptionPlan.findFirst({ where: { isActive: true }, orderBy: { price: "asc" } })

    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          status: "ACTIVE",
          approvedAt: new Date(),
          approvedBy: session.user.id,
          ...(adminNotes !== undefined && { adminNotes }),
        },
      })

      if (defaultPlan) {
        await tx.license.upsert({
          where: { organizationId },
          create: {
            organizationId,
            planId: defaultPlan.id,
            maxUsers: maxUsers ?? (defaultPlan.features as any)?.maxUsers ?? 5,
            maxApiCalls: maxApiCalls ?? (defaultPlan.features as any)?.maxApiCalls ?? 10000,
            maxAiTokens: maxAiTokens ?? (defaultPlan.features as any)?.aiTokens ?? 50000,
            ...(billingContact !== undefined && { billingContact }),
          },
          update: {
            planId: defaultPlan.id,
            maxUsers: maxUsers ?? (defaultPlan.features as any)?.maxUsers ?? 5,
            maxApiCalls: maxApiCalls ?? (defaultPlan.features as any)?.maxApiCalls ?? 10000,
            maxAiTokens: maxAiTokens ?? (defaultPlan.features as any)?.aiTokens ?? 50000,
            ...(billingContact !== undefined && { billingContact }),
          },
        })
      }

      await tx.financialSettings.upsert({
        where: { organizationId },
        create: {
          organizationId,
          ...(aiProvider !== undefined && { aiProvider }),
          ...(aiModel !== undefined && { aiModel }),
          ...(aiApiKey !== undefined && { aiApiKey }),
        },
        update: {
          ...(aiProvider !== undefined && { aiProvider }),
          ...(aiModel !== undefined && { aiModel }),
          ...(aiApiKey !== undefined && { aiApiKey }),
        }
      })
    })

    // Fetch the admin user of this organization to send welcome email
    const orgWithUsers = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    })

    const adminUser = orgWithUsers?.users[0]?.user
    if (adminUser) {
      await sendEmail({
        to: adminUser.email,
        subject: "Welcome to Ryzha! Your organization is approved.",
        text: `Hi ${adminUser.name},\n\nYour organization ${orgWithUsers.name} has been approved by the admin. You can now login and invite your team.`,
        html: `<p>Hi ${adminUser.name},</p><p>Your organization <strong>${orgWithUsers.name}</strong> has been approved by the admin. You can now login and invite your team.</p>`
      }).catch(err => {
        console.error("Failed to send welcome email:", err)
      })
    }

    return NextResponse.json({ success: true, action: "approved" })
  }

  if (action === "reject") {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { status: "REJECTED" },
    })

    return NextResponse.json({ success: true, action: "rejected" })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
