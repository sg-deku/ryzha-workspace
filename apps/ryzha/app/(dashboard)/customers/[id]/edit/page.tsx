import CustomerForm from "../../customer-form"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const customer = await prisma.customer.findUnique({
    where: { 
      id,
      organizationId: session.user.organizationId 
    }
  })

  if (!customer) return notFound()

  return <CustomerForm initialData={customer} />
}