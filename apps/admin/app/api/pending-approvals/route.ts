import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail, emailTemplate } from "@/lib/email"

export const dynamic = "force-dynamic"

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
          deferredRevenueRules: ["annual", "yearly", "subscription"],
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
      const appUrl = process.env.CLIENT_URL || process.env.NEXTAUTH_URL || "https://ryzha.vercel.app"
      await sendEmail({
        to: adminUser.email,
        subject: `🎉 ${orgWithUsers.name} is approved — welcome to Ryzha!`,
        html: emailTemplate(`
          <h1 style="font-size:22px;font-weight:700;color:#09090b;margin:0 0 16px;">Welcome to Ryzha, ${adminUser.name}!</h1>
          <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 14px;">
            Great news — your organisation <strong>${orgWithUsers.name}</strong> has been approved and your account is now active.
          </p>
          <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 20px;">
            You can now log in, invite your team members, and start using Ryzha's financial intelligence platform.
          </p>
          <a href="${appUrl}/login" style="display:inline-block;background:#09090b;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
            Log In to Ryzha
          </a>
          <p style="font-size:13px;color:#a1a1aa;margin:24px 0 0;">
            If you have any questions, simply reply to this email — we're here to help.
          </p>
        `),
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
