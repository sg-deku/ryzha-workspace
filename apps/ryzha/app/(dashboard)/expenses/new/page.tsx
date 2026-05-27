import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import NewExpenseClient from "./new-expense-client"

export const dynamic = 'force-dynamic'

export default async function NewExpensePage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  let categories = ["Software", "Hardware", "Office Supplies", "Travel", "Meals", "Legal", "Marketing", "Other"]

  return <NewExpenseClient categories={categories} />
}
