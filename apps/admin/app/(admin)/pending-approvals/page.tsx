import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { formatDate } from "@/lib/utils"
import { ApprovalActions } from "./approval-actions"

export const dynamic = "force-dynamic"

export default async function PendingApprovalsPage() {
  const session = await getSession()
  if (!session?.user?.isSuperAdmin) redirect("/login")

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

  const defaultPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: { id: true, name: true, features: true, interval: true },
  })

  return (
    <>
      <Header title="Pending Approvals" />
      <div className="flex-1 p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{pending.length} organization(s) awaiting review</p>

        {pending.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            No pending approvals. 
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((org) => {
              const owner = org.users[0]?.user
              return (
                <div key={org.id} className="rounded-lg border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold">{org.name}</p>
                      <p className="text-sm text-muted-foreground">/{org.slug}</p>
                      {owner && (
                        <p className="text-sm text-muted-foreground">
                          Owner: {owner.name} ({owner.email})
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Requested: {formatDate(org.createdAt)}
                      </p>
                    </div>
                    <ApprovalActions organizationId={org.id} plans={defaultPlans} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
