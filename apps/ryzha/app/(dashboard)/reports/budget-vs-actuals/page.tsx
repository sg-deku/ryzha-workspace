import { redirect } from "next/navigation"
import { BudgetVsActualsClient } from "./budget-vs-actuals-client"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function BudgetVsActualsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const budgets = await prisma.budget.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true, fiscalYear: true, period: true, status: true },
    orderBy: [{ fiscalYear: "desc" }, { createdAt: "desc" }],
  })

  return <BudgetVsActualsClient budgets={budgets} />
}
