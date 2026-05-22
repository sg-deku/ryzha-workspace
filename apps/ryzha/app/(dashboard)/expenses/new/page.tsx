import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import NewExpenseClient from "./new-expense-client"

export const dynamic = 'force-dynamic'

export default async function NewExpensePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId: session.user.organizationId }
  })

  let categories = ["Software", "Hardware", "Office Supplies", "Travel", "Meals", "Legal", "Marketing", "Other"]
  
  if (settings?.expenseCategories) {
    try {
      const parsed = typeof settings.expenseCategories === 'string' 
        ? JSON.parse(settings.expenseCategories as string) 
        : settings.expenseCategories
      if (Array.isArray(parsed)) categories = parsed
    } catch {
      // Keep default
    }
  }

  return <NewExpenseClient categories={categories} />
}
