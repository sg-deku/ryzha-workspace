import { notFound } from "next/navigation"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { ExpenseDetailClient } from "./expense-detail-client"

export const dynamic = "force-dynamic"

export default async function ExpenseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (!session?.user?.organizationId) return notFound()

  const expense = await prisma.expense.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: { anomalies: true },
  })

  if (!expense) return notFound()

  const categories = ["Software", "Hardware", "Office Supplies", "Travel", "Meals", "Legal", "Marketing", "Other"]

  return <ExpenseDetailClient expense={JSON.parse(JSON.stringify(expense))} categories={categories} />
}
