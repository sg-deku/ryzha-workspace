import CustomerForm from "../../customer-form"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const customer = await prisma.customer.findUnique({
    where: { 
      id: params.id,
      organizationId: session.user.organizationId 
    }
  })

  if (!customer) return notFound()

  return <CustomerForm initialData={customer} />
}