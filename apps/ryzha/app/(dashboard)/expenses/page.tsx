import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ExpensesClient } from "./expenses-client"

export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const expenses = await prisma.expense.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { date: "desc" }
  })

  // Group data for chart
  const categories = expenses.reduce((acc: Record<string, number>, curr) => {
    const cat = curr.category || "Uncategorized"
    acc[cat] = (acc[cat] || 0) + curr.amount
    return acc
  }, {})

  const chartData = Object.entries(categories).map(([name, value]) => ({ name, value }))

  return (
    <ExpensesClient 
      initialExpenses={JSON.parse(JSON.stringify(expenses))} 
      chartData={chartData} 
    />
  )
}
