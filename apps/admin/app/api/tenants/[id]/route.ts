import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        include: {
          user: { select: { id: true, name: true, email: true, status: true, createdAt: true } },
          role: true,
        },
      },
      license: { include: { plan: true } },
      usageMetrics: {
        orderBy: { date: "desc" },
        take: 90,
      },
    },
  })

  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(org)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { status, name } = body

  const orgBefore = await prisma.organization.findUnique({ where: { id } })

  const org = await prisma.organization.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(name !== undefined && { name }),
      ...(status === "ACTIVE" && {
        approvedAt: new Date(),
        approvedBy: session.user.id,
      }),
    },
    include: {
      users: {
        include: {
          user: true
        }
      }
    }
  })

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_ORGANIZATION",
      entityType: "ORGANIZATION",
      entityId: id,
      actorId: session.user.id,
      organizationId: id,
      details: {
        status: status !== undefined ? status : undefined,
        name: name !== undefined ? name : undefined,
        approved: status === "ACTIVE" && orgBefore?.status !== "ACTIVE"
      }
    }
  })

  if (status === "ACTIVE" && orgBefore?.status !== "ACTIVE") {
    try {
      const { sendEmail, emailTemplate } = await import("@/lib/email")
      const appUrl = process.env.CLIENT_URL || process.env.NEXTAUTH_URL || "https://ryzha.vercel.app"
      for (const uo of org.users) {
        if (uo.user?.email) {
          await sendEmail({
            to: uo.user.email,
            subject: `🎉 ${org.name} is approved — welcome to Ryzha!`,
            html: emailTemplate(`
              <h1 style="font-size:22px;font-weight:700;color:#09090b;margin:0 0 16px;">Welcome to Ryzha${uo.user.name ? `, ${uo.user.name}` : ""}!</h1>
              <p style="font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 14px;">
                Great news — your organisation <strong>${org.name}</strong> has been approved and your account is now active.
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
            `)
          })
        }
      }
    } catch (error) {
      console.error("Failed to send welcome email:", error)
    }
  }

  return NextResponse.json(org)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { deleteAll, modules } = body || { deleteAll: true }

    await prisma.$transaction(async (tx) => {
      // 1. Logs & Webhooks
      if (deleteAll || modules?.logs) {
        const webhooks = await tx.webhook.findMany({ where: { organizationId: id } })
        if (webhooks.length > 0) {
          await tx.webhookLog.deleteMany({ where: { webhookId: { in: webhooks.map(w => w.id) } } })
          await tx.webhook.deleteMany({ where: { organizationId: id } })
        }
        await tx.reportSchedule.deleteMany({ where: { organizationId: id } })
        await tx.notification.deleteMany({ where: { organizationId: id } })
        await tx.aIUsageLog.deleteMany({ where: { organizationId: id } })
        await tx.chatMessage.deleteMany({ where: { organizationId: id } })
        await tx.usageMetrics.deleteMany({ where: { organizationId: id } })
      }

      // 2. Settings
      if (deleteAll || modules?.settings) {
        await tx.financialSettings.deleteMany({ where: { organizationId: id } })
        await tx.p2PSettings.deleteMany({ where: { organizationId: id } })
        await tx.o2CSettings.deleteMany({ where: { organizationId: id } })
        await tx.taxRule.deleteMany({ where: { organizationId: id } })
        await tx.chartOfAccounts.deleteMany({ where: { organizationId: id } })
        await tx.dashboardLayout.deleteMany({ where: { organizationId: id } })
      }

      // 3. Financial Data
      if (deleteAll || modules?.financial) {
        const expenses = await tx.expense.findMany({ where: { organizationId: id } })
        if (expenses.length > 0) {
          await tx.expenseAnomaly.deleteMany({ where: { expenseId: { in: expenses.map(e => e.id) } } })
          await tx.expense.deleteMany({ where: { organizationId: id } })
        }
        const invoices = await tx.invoice.findMany({ where: { organizationId: id } })
        if (invoices.length > 0) {
          await tx.invoiceLineItem.deleteMany({ where: { invoiceId: { in: invoices.map(i => i.id) } } })
          await tx.invoice.deleteMany({ where: { organizationId: id } })
        }
        const vendorInvoices = await tx.vendorInvoice.findMany({ where: { organizationId: id } })
        if (vendorInvoices.length > 0) {
          await tx.vendorInvoiceLine.deleteMany({ where: { vendorInvoiceId: { in: vendorInvoices.map(vi => vi.id) } } })
          await tx.vendorInvoice.deleteMany({ where: { organizationId: id } })
        }
        const purchaseOrders = await tx.purchaseOrder.findMany({ where: { organizationId: id } })
        if (purchaseOrders.length > 0) {
          await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: { in: purchaseOrders.map(po => po.id) } } })
          await tx.purchaseOrder.deleteMany({ where: { organizationId: id } })
        }
        const salesOrders = await tx.salesOrder.findMany({ where: { organizationId: id } })
        if (salesOrders.length > 0) {
          await tx.salesOrderLine.deleteMany({ where: { salesOrderId: { in: salesOrders.map(so => so.id) } } })
          await tx.salesOrder.deleteMany({ where: { organizationId: id } })
        }
        await tx.transaction.deleteMany({ where: { organizationId: id } })
        await tx.contract.deleteMany({ where: { organizationId: id } })
        await tx.generalLedgerEntry.deleteMany({ where: { organizationId: id } })
        await tx.financialSnapshot.deleteMany({ where: { organizationId: id } })
        await tx.customer.deleteMany({ where: { organizationId: id } })
        await tx.vendor.deleteMany({ where: { organizationId: id } })
      }

      // 4. Users & Roles
      if (deleteAll || modules?.users) {
        const userOrgs = await tx.userOrganization.findMany({
          where: { organizationId: id },
          select: { userId: true }
        })
        const userIds = userOrgs.map(uo => uo.userId)

        await tx.userOrganization.deleteMany({ where: { organizationId: id } })
        
        const roles = await tx.role.findMany({ where: { organizationId: id } })
        if (roles.length > 0) {
          await tx.rolePermission.deleteMany({ where: { roleId: { in: roles.map(r => r.id) } } })
          await tx.role.deleteMany({ where: { organizationId: id } })
        }

        if (userIds.length > 0) {
          const usersInOtherOrgs = await tx.userOrganization.findMany({
            where: { userId: { in: userIds } },
            select: { userId: true }
          })
          const userIdsWithOtherOrgs = new Set(usersInOtherOrgs.map(uo => uo.userId))
          const userIdsToDelete = userIds.filter(uid => !userIdsWithOtherOrgs.has(uid))

          if (userIdsToDelete.length > 0) {
            await tx.chatMessage.deleteMany({ where: { userId: { in: userIdsToDelete } } })
            await tx.user.deleteMany({
              where: {
                id: { in: userIdsToDelete },
                isSuperAdmin: false
              }
            })
          }
        }
      }

      // 5. Delete Organization itself if requested
      if (deleteAll) {
        // Redundant cleanup just to be absolutely sure no constraints fail
        await tx.financialSettings.deleteMany({ where: { organizationId: id } })
        await tx.p2PSettings.deleteMany({ where: { organizationId: id } })
        await tx.o2CSettings.deleteMany({ where: { organizationId: id } })
        await tx.license.deleteMany({ where: { organizationId: id } })
        await tx.organization.delete({ where: { id } })
      }

      await tx.auditLog.create({
        data: {
          action: deleteAll ? "DELETE_ORGANIZATION" : "PURGE_ORGANIZATION_MODULES",
          entityType: "ORGANIZATION",
          entityId: id,
          actorId: session.user.id,
          organizationId: deleteAll ? null : id,
          details: { deleteAll, modules }
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 })
  }
}
