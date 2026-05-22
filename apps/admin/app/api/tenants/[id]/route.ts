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

  if (status === "ACTIVE" && orgBefore?.status !== "ACTIVE") {
    try {
      const { sendEmail } = await import("@/lib/email")
      for (const uo of org.users) {
        if (uo.user?.email) {
          await sendEmail({
            to: uo.user.email,
            subject: "Your Organization is Approved!",
            html: `
              <h1>Welcome to Ryzha!</h1>
              <p>Your organization <strong>${org.name}</strong> has been approved.</p>
              <p>You can now log in to the Ryzha app and set up your workspace.</p>
              <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login">Log in here</a></p>
            `
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
        await tx.license.deleteMany({ where: { organizationId: id } })
        await tx.organization.delete({ where: { id } })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 })
  }
}
