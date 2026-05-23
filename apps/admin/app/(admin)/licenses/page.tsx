import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { CreatePlanDialog } from "./create-plan-dialog"
import { PlanActions } from "./plan-actions"

export const dynamic = "force-dynamic"

export default async function LicensesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) redirect("/login")

  const plans = await prisma.subscriptionPlan.findMany({
    include: { _count: { select: { licenses: true } } },
    orderBy: { price: "asc" },
  })

  return (
    <>
      <Header title="License Plans" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{plans.length} plans</p>
          <CreatePlanDialog />
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Interval</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Tenants</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{plan.name}</p>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">${plan.price.toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">{plan.interval}</td>
                  <td className="px-4 py-3 text-right">{plan._count.licenses}</td>
                  <td className="px-4 py-3">
                    <Badge variant={plan.isActive ? "success" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PlanActions planId={plan.id} inUse={plan._count.licenses > 0} />
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No plans yet. Create your first plan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
