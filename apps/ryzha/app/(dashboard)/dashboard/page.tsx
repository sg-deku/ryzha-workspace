import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "./dashboard-client"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const [pendingPurchases, overdueSales] = await Promise.all([
    prisma.purchaseOrder.count({
      where: { organizationId: session.user.organizationId, status: "PENDING_APPROVAL" }
    }),
    prisma.salesOrder.count({
      where: { 
        organizationId: session.user.organizationId, 
        status: "INVOICED",
        createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    })
  ])

  return (
    <DashboardClient 
      userName={session.user?.name} 
      orgId={session.user?.organizationId}
      pendingPurchases={pendingPurchases}
      overdueSales={overdueSales}
    />
  )
}
